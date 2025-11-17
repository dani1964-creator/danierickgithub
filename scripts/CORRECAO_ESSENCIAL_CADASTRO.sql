-- ============================================================================
-- CORREÇÃO ESSENCIAL - CADASTRO DE IMOBILIÁRIA
-- ============================================================================
-- Execute este script apenas se a VERIFICACAO_RAPIDA_CADASTRO.sql mostrou ❌
-- ============================================================================

DO $$ 
BEGIN
  RAISE NOTICE '🔧 APLICANDO CORREÇÕES ESSENCIAIS';
  RAISE NOTICE '══════════════════════════════════════════════════════════';
END $$;

-- ============================================================================
-- 1. GARANTIR QUE COLUNA display_name EXISTE
-- ============================================================================

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'brokers' AND column_name = 'display_name'
  ) THEN
    ALTER TABLE public.brokers ADD COLUMN display_name TEXT;
    RAISE NOTICE '✅ Coluna display_name adicionada';
  ELSE
    RAISE NOTICE '✓ Coluna display_name já existe';
  END IF;
END $$;

-- ============================================================================
-- 2. CRIAR/RECRIAR FUNÇÃO initialize_subscription_trial
-- ============================================================================

CREATE OR REPLACE FUNCTION public.initialize_subscription_trial(broker_uuid UUID)
RETURNS UUID 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = 'public' 
AS $$
DECLARE
  subscription_id UUID;
  trial_end_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Verificar se já existe subscription
  SELECT id INTO subscription_id 
  FROM public.subscriptions 
  WHERE broker_id = broker_uuid 
  LIMIT 1;
  
  IF subscription_id IS NOT NULL THEN
    RAISE NOTICE 'Subscription já existe para broker %, retornando ID %', broker_uuid, subscription_id;
    RETURN subscription_id;
  END IF;
  
  -- Calcular data de término do trial (30 dias)
  trial_end_date := now() + INTERVAL '30 days';
  
  -- Criar subscription
  INSERT INTO public.subscriptions (
    broker_id, 
    plan_type, 
    status, 
    trial_start_date, 
    trial_end_date, 
    current_period_start, 
    current_period_end
  )
  VALUES (
    broker_uuid, 
    'trial', 
    'trial', 
    now(), 
    trial_end_date, 
    now(), 
    trial_end_date
  )
  RETURNING id INTO subscription_id;
  
  -- Atualizar trial_ends_at no broker
  UPDATE public.brokers 
  SET trial_ends_at = trial_end_date, updated_at = now() 
  WHERE id = broker_uuid;
  
  RAISE NOTICE 'Subscription % criada para broker %', subscription_id, broker_uuid;
  RETURN subscription_id;
END; 
$$;

DO $$ 
BEGIN
  RAISE NOTICE '✅ Função initialize_subscription_trial criada';
END $$;

-- ============================================================================
-- 3. HABILITAR RLS E CRIAR POLICIES ESSENCIAIS
-- ============================================================================

-- Habilitar RLS
ALTER TABLE public.brokers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Remover policy antiga se existir
DROP POLICY IF EXISTS "service_role_brokers_all" ON public.brokers;

-- Criar policy para service_role em brokers
CREATE POLICY "service_role_brokers_all"
  ON public.brokers
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DO $$ 
BEGIN
  RAISE NOTICE '✅ Policy service_role_brokers_all criada';
END $$;

-- Remover policy antiga se existir
DROP POLICY IF EXISTS "service_role_subscriptions_all" ON public.subscriptions;

-- Criar policy para service_role em subscriptions
CREATE POLICY "service_role_subscriptions_all"
  ON public.subscriptions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DO $$ 
BEGIN
  RAISE NOTICE '✅ Policy service_role_subscriptions_all criada';
END $$;

-- ============================================================================
-- 4. GARANTIR POLICIES PARA USUÁRIOS AUTENTICADOS
-- ============================================================================

-- Policy para usuários autenticados criarem broker
DROP POLICY IF EXISTS "authenticated_brokers_insert" ON public.brokers;

CREATE POLICY "authenticated_brokers_insert"
  ON public.brokers
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Policy para usuários autenticados verem seu broker
DROP POLICY IF EXISTS "authenticated_brokers_select" ON public.brokers;

CREATE POLICY "authenticated_brokers_select"
  ON public.brokers
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy para usuários autenticados atualizarem seu broker
DROP POLICY IF EXISTS "authenticated_brokers_update" ON public.brokers;

CREATE POLICY "authenticated_brokers_update"
  ON public.brokers
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DO $$ 
BEGIN
  RAISE NOTICE '✅ Policies para authenticated criadas';
END $$;

-- ============================================================================
-- 5. VERIFICAÇÃO FINAL
-- ============================================================================

DO $$ 
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '══════════════════════════════════════════════════════════';
  RAISE NOTICE '✅✅✅ CORREÇÕES APLICADAS COM SUCESSO ✅✅✅';
  RAISE NOTICE '══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📋 PRÓXIMOS PASSOS:';
  RAISE NOTICE '1. Acesse /cadastro no frontend';
  RAISE NOTICE '2. Preencha o formulário';
  RAISE NOTICE '3. Clique em "Começar Teste Grátis"';
  RAISE NOTICE '4. Abra o Console do navegador (F12) para ver logs detalhados';
  RAISE NOTICE '';
END $$;
