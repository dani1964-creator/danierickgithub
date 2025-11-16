-- ================================================
-- APLICAR IMEDIATAMENTE - CORRIGIR DIAS RESTANTES
-- ================================================
-- Execute este script AGORA no Supabase SQL Editor
-- ================================================

-- Atualizar função para usar CEIL
CREATE OR REPLACE FUNCTION public.get_subscription_days_remaining(broker_uuid UUID)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  end_date TIMESTAMP WITH TIME ZONE;
  days_remaining NUMERIC;
BEGIN
  SELECT current_period_end INTO end_date
  FROM public.subscriptions
  WHERE broker_id = broker_uuid
  AND status IN ('trial', 'active');
  
  IF end_date IS NULL THEN
    RETURN -1;
  END IF;
  
  -- CEIL arredonda para cima (igual JavaScript Math.ceil)
  days_remaining := CEIL(EXTRACT(EPOCH FROM (end_date - now())) / 86400);
  
  RETURN GREATEST(days_remaining::INTEGER, 0);
END;
$$;

-- Verificar resultado
SELECT 
  broker_id,
  current_period_end,
  public.get_subscription_days_remaining(broker_id) as dias_restantes
FROM public.subscriptions
WHERE status IN ('trial', 'active');
