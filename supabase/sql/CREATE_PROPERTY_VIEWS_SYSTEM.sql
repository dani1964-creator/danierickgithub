-- ============================================================================
-- SISTEMA DE VISUALIZAÇÕES ÚNICAS POR IP
-- Rastreia visualizações únicas de imóveis por endereço IP
-- ============================================================================

-- Criar tabela de visualizações
CREATE TABLE IF NOT EXISTS public.property_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  ip_address TEXT NOT NULL,
  user_agent TEXT,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_property_views_property_id ON public.property_views(property_id);
CREATE INDEX IF NOT EXISTS idx_property_views_ip_property ON public.property_views(ip_address, property_id);
CREATE INDEX IF NOT EXISTS idx_property_views_viewed_at ON public.property_views(viewed_at DESC);

-- Constraint única: um IP só pode visualizar um imóvel uma vez
CREATE UNIQUE INDEX IF NOT EXISTS idx_property_views_unique_view 
ON public.property_views(property_id, ip_address);

-- Habilitar RLS
ALTER TABLE public.property_views ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (visualizações são públicas para leitura, apenas sistema pode inserir)
CREATE POLICY "Anyone can view property views" 
ON public.property_views FOR SELECT 
USING (true);

CREATE POLICY "System can insert property views" 
ON public.property_views FOR INSERT 
WITH CHECK (true);

-- ============================================================================
-- FUNÇÃO: Registrar visualização única
-- ============================================================================
CREATE OR REPLACE FUNCTION public.register_property_view(
  p_property_id UUID,
  p_ip_address TEXT,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_new_view BOOLEAN := FALSE;
  v_current_count INTEGER;
  v_view_id UUID;
BEGIN
  -- Tenta inserir a visualização (falha se já existir devido ao índice único)
  BEGIN
    INSERT INTO public.property_views (property_id, ip_address, user_agent)
    VALUES (p_property_id, p_ip_address, p_user_agent)
    RETURNING id INTO v_view_id;
    
    v_is_new_view := TRUE;
    
    -- Se é uma nova visualização, incrementa o contador
    UPDATE public.properties
    SET views_count = COALESCE(views_count, 0) + 1
    WHERE id = p_property_id;
    
  EXCEPTION WHEN unique_violation THEN
    -- IP já visualizou este imóvel, não faz nada
    v_is_new_view := FALSE;
  END;
  
  -- Busca o contador atual
  SELECT COALESCE(views_count, 0) INTO v_current_count
  FROM public.properties
  WHERE id = p_property_id;
  
  -- Retorna resultado
  RETURN jsonb_build_object(
    'is_new_view', v_is_new_view,
    'views_count', v_current_count,
    'view_id', v_view_id
  );
END;
$$;

-- ============================================================================
-- FUNÇÃO: Obter estatísticas de visualizações
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_property_view_stats(p_property_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_views INTEGER;
  v_unique_views INTEGER;
  v_today_views INTEGER;
  v_week_views INTEGER;
  v_month_views INTEGER;
BEGIN
  -- Total de visualizações únicas
  SELECT COUNT(*)::INTEGER INTO v_unique_views
  FROM public.property_views
  WHERE property_id = p_property_id;
  
  -- Views de hoje
  SELECT COUNT(*)::INTEGER INTO v_today_views
  FROM public.property_views
  WHERE property_id = p_property_id
    AND viewed_at >= CURRENT_DATE;
  
  -- Views da última semana
  SELECT COUNT(*)::INTEGER INTO v_week_views
  FROM public.property_views
  WHERE property_id = p_property_id
    AND viewed_at >= CURRENT_DATE - INTERVAL '7 days';
  
  -- Views do último mês
  SELECT COUNT(*)::INTEGER INTO v_month_views
  FROM public.property_views
  WHERE property_id = p_property_id
    AND viewed_at >= CURRENT_DATE - INTERVAL '30 days';
  
  -- Contador geral da tabela properties
  SELECT COALESCE(views_count, 0)::INTEGER INTO v_total_views
  FROM public.properties
  WHERE id = p_property_id;
  
  RETURN jsonb_build_object(
    'total_views', v_total_views,
    'unique_views', v_unique_views,
    'today_views', v_today_views,
    'week_views', v_week_views,
    'month_views', v_month_views
  );
END;
$$;

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================
COMMENT ON TABLE public.property_views IS 'Rastreia visualizações únicas de imóveis por IP';
COMMENT ON FUNCTION public.register_property_view IS 'Registra uma visualização única de imóvel por IP';
COMMENT ON FUNCTION public.get_property_view_stats IS 'Retorna estatísticas detalhadas de visualizações de um imóvel';
