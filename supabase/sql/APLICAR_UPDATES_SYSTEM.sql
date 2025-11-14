-- ============================================================================
-- APLICAR NO SQL EDITOR DO SUPABASE
-- ============================================================================
-- Este é um script resumido para criar o Sistema de Atualizações e Sugestões
-- no Supabase Dashboard. Copie e cole tudo no SQL Editor e execute.
-- ============================================================================

-- 1. CRIAR TABELAS
CREATE TABLE IF NOT EXISTS public.app_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  update_type text NOT NULL DEFAULT 'feature' CHECK (update_type IN ('feature', 'improvement', 'bugfix', 'announcement')),
  icon text,
  is_published boolean NOT NULL DEFAULT false,
  published_at timestamp with time zone,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.improvement_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL DEFAULT 'other' CHECK (category IN ('feature', 'improvement', 'bugfix', 'ux', 'performance', 'other')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'planned', 'in_progress', 'completed', 'rejected')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  votes_count integer NOT NULL DEFAULT 0,
  broker_id uuid NOT NULL REFERENCES public.brokers(id) ON DELETE CASCADE,
  admin_notes text,
  reviewed_at timestamp with time zone,
  reviewed_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.suggestion_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  suggestion_id uuid NOT NULL REFERENCES public.improvement_suggestions(id) ON DELETE CASCADE,
  broker_id uuid NOT NULL REFERENCES public.brokers(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(suggestion_id, broker_id)
);

-- 2. CRIAR ÍNDICES
CREATE INDEX IF NOT EXISTS idx_app_updates_published ON public.app_updates(is_published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_improvement_suggestions_status ON public.improvement_suggestions(status, votes_count DESC);
CREATE INDEX IF NOT EXISTS idx_suggestion_votes_suggestion ON public.suggestion_votes(suggestion_id);

-- 3. HABILITAR RLS
ALTER TABLE public.app_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.improvement_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suggestion_votes ENABLE ROW LEVEL SECURITY;

-- 4. POLÍTICAS RLS
-- Admin pode tudo em app_updates
CREATE POLICY "Admin can do everything on app_updates" ON public.app_updates FOR ALL
  USING (EXISTS (SELECT 1 FROM public.brokers WHERE brokers.user_id = auth.uid() AND brokers.is_super_admin = true));

-- Corretores podem ver atualizações publicadas
CREATE POLICY "Brokers can view published updates" ON public.app_updates FOR SELECT
  USING (is_published = true AND EXISTS (SELECT 1 FROM public.brokers WHERE brokers.user_id = auth.uid()));

-- Admin pode ver e atualizar todas as sugestões
CREATE POLICY "Admin can view all suggestions" ON public.improvement_suggestions FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.brokers WHERE brokers.user_id = auth.uid() AND brokers.is_super_admin = true));

CREATE POLICY "Admin can update suggestions" ON public.improvement_suggestions FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.brokers WHERE brokers.user_id = auth.uid() AND brokers.is_super_admin = true));

-- Corretores podem criar e ver sugestões
CREATE POLICY "Brokers can create suggestions" ON public.improvement_suggestions FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.brokers WHERE brokers.id = broker_id AND brokers.user_id = auth.uid()));

CREATE POLICY "Brokers can view all suggestions" ON public.improvement_suggestions FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.brokers WHERE brokers.user_id = auth.uid()));

-- Corretores podem votar
CREATE POLICY "Brokers can vote" ON public.suggestion_votes FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.brokers WHERE brokers.id = broker_id AND brokers.user_id = auth.uid()));

CREATE POLICY "Brokers can remove vote" ON public.suggestion_votes FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.brokers WHERE brokers.id = broker_id AND brokers.user_id = auth.uid()));

CREATE POLICY "Brokers can view votes" ON public.suggestion_votes FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.brokers WHERE brokers.user_id = auth.uid()));

-- 5. TRIGGERS
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_app_updates_updated_at BEFORE UPDATE ON public.app_updates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_improvement_suggestions_updated_at BEFORE UPDATE ON public.improvement_suggestions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION set_published_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_published = true AND OLD.is_published = false THEN
    NEW.published_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_app_updates_published_at BEFORE UPDATE ON public.app_updates
  FOR EACH ROW EXECUTE FUNCTION set_published_at();

CREATE OR REPLACE FUNCTION update_suggestion_votes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.improvement_suggestions SET votes_count = votes_count + 1 WHERE id = NEW.suggestion_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.improvement_suggestions SET votes_count = votes_count - 1 WHERE id = OLD.suggestion_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_votes_count_on_vote AFTER INSERT OR DELETE ON public.suggestion_votes
  FOR EACH ROW EXECUTE FUNCTION update_suggestion_votes_count();

-- 6. FUNÇÕES RPC
CREATE OR REPLACE FUNCTION toggle_suggestion_vote(p_suggestion_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_broker_id uuid;
  v_existing_vote uuid;
BEGIN
  SELECT id INTO v_broker_id FROM public.brokers WHERE user_id = auth.uid();
  IF v_broker_id IS NULL THEN RAISE EXCEPTION 'Broker not found'; END IF;
  
  SELECT id INTO v_existing_vote FROM public.suggestion_votes 
  WHERE suggestion_id = p_suggestion_id AND broker_id = v_broker_id;
  
  IF v_existing_vote IS NOT NULL THEN
    DELETE FROM public.suggestion_votes WHERE id = v_existing_vote;
    RETURN false;
  ELSE
    INSERT INTO public.suggestion_votes (suggestion_id, broker_id) VALUES (p_suggestion_id, v_broker_id);
    RETURN true;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION get_suggestions_with_user_votes()
RETURNS TABLE(
  id uuid, title text, description text, category text, status text, priority text,
  votes_count integer, broker_id uuid, broker_name text, admin_notes text,
  created_at timestamp with time zone, updated_at timestamp with time zone, user_has_voted boolean
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
AS $$
DECLARE v_broker_id uuid;
BEGIN
  SELECT brokers.id INTO v_broker_id FROM public.brokers WHERE brokers.user_id = auth.uid();
  
  RETURN QUERY
  SELECT s.id, s.title, s.description, s.category, s.status, s.priority, s.votes_count,
    s.broker_id, b.business_name as broker_name, s.admin_notes, s.created_at, s.updated_at,
    EXISTS(SELECT 1 FROM public.suggestion_votes sv WHERE sv.suggestion_id = s.id AND sv.broker_id = v_broker_id) as user_has_voted
  FROM public.improvement_suggestions s
  JOIN public.brokers b ON s.broker_id = b.id
  ORDER BY s.votes_count DESC, s.created_at DESC;
END;
$$;

NOTIFY pgrst, 'reload schema';
