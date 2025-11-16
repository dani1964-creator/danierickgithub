-- ================================================
-- CORREÇÃO: CÁLCULO DE DIAS RESTANTES CONSISTENTE
-- ================================================
-- Problema: Diferença de 1 dia entre banner e página de planos
-- Causa: SQL usa EXTRACT(DAY) que arredonda para baixo
--        JavaScript usa Math.ceil() que arredonda para cima
-- Solução: Padronizar ambos para CEIL (arredondar para cima)
-- ================================================

-- ===========================================
-- PASSO 1: VERIFICAR CÁLCULO ATUAL
-- ===========================================

SELECT '=== 1. VERIFICAR FUNÇÃO ATUAL ===' AS step;

-- Ver definição atual da função
SELECT routine_name, routine_definition 
FROM information_schema.routines 
WHERE routine_name = 'get_subscription_days_remaining';

-- Testar cálculo atual
SELECT 
  broker_id,
  current_period_end,
  now() as current_time,
  public.get_subscription_days_remaining(broker_id) as days_remaining_atual
FROM public.subscriptions
WHERE status IN ('trial', 'active')
LIMIT 5;

-- ===========================================
-- PASSO 2: ATUALIZAR FUNÇÃO COM CEIL
-- ===========================================

SELECT '=== 2. ATUALIZANDO FUNÇÃO ===' AS step;

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
    RETURN -1; -- Sem assinatura ativa
  END IF;
  
  -- Usar CEIL para arredondar para cima (consistente com JavaScript Math.ceil)
  -- EXTRACT(EPOCH) retorna segundos, dividir por 86400 para obter dias
  days_remaining := CEIL(EXTRACT(EPOCH FROM (end_date - now())) / 86400);
  
  RETURN GREATEST(days_remaining::INTEGER, 0);
END;
$$;

-- ===========================================
-- PASSO 3: VERIFICAR NOVO CÁLCULO
-- ===========================================

SELECT '=== 3. VERIFICAR NOVO CÁLCULO ===' AS step;

-- Comparar antes (EXTRACT DAY) vs depois (CEIL EPOCH)
SELECT 
  broker_id,
  current_period_end,
  now() as current_time,
  -- Cálculo antigo (EXTRACT DAY - arredonda para baixo)
  EXTRACT(DAY FROM (current_period_end - now()))::INTEGER as old_calculation,
  -- Cálculo novo (CEIL EPOCH - arredonda para cima)
  CEIL(EXTRACT(EPOCH FROM (current_period_end - now())) / 86400)::INTEGER as new_calculation,
  -- Função atualizada
  public.get_subscription_days_remaining(broker_id) as function_result
FROM public.subscriptions
WHERE status IN ('trial', 'active')
LIMIT 10;

-- ===========================================
-- PASSO 4: ATUALIZAR COMENTÁRIO DA FUNÇÃO
-- ===========================================

SELECT '=== 4. ATUALIZANDO COMENTÁRIO ===' AS step;

COMMENT ON FUNCTION public.get_subscription_days_remaining IS 
'Calcula dias restantes da assinatura ativa usando CEIL (arredonda para cima, consistente com frontend)';

-- ===========================================
-- PASSO 5: REFRESH MATERIALIZED VIEWS (se houver)
-- ===========================================

SELECT '=== 5. REFRESH VIEWS ===' AS step;

-- Atualizar view subscription_details para refletir nova função
-- (Não é necessário alterar a view, ela já chama a função)
REFRESH MATERIALIZED VIEW IF EXISTS subscription_stats;

-- ===========================================
-- PASSO 6: VERIFICAÇÃO FINAL
-- ===========================================

SELECT '=== 6. VERIFICAÇÃO FINAL ===' AS step;

-- Testar com exemplos práticos
SELECT 
  'Teste: Data final amanhã às 23:59' as scenario,
  CEIL(EXTRACT(EPOCH FROM (now() + interval '1 day 7 hours' - now())) / 86400)::INTEGER as days_remaining,
  'Deve retornar 2 dias' as expected;

SELECT 
  'Teste: Data final hoje às 23:59' as scenario,
  CEIL(EXTRACT(EPOCH FROM (now() + interval '7 hours' - now())) / 86400)::INTEGER as days_remaining,
  'Deve retornar 1 dia' as expected;

SELECT 
  'Teste: Data final em 29 dias e 7 horas' as scenario,
  CEIL(EXTRACT(EPOCH FROM (now() + interval '29 days 7 hours' - now())) / 86400)::INTEGER as days_remaining,
  'Deve retornar 30 dias' as expected;

SELECT '=== ✅ CORREÇÃO COMPLETA ===' AS final_message;
SELECT 'Ambos frontend e backend agora usam CEIL (arredonda para cima)' AS note;
SELECT 'Recarregue a página /painel/planos para ver valores consistentes' AS next_step;
