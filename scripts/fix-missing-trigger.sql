-- Script de correção: Criar trigger de sincronização trial_ends_at
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se o trigger já existe (deve retornar 0 linhas)
SELECT trigger_name 
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
  AND trigger_name = 'sync_trial_ends_at_trigger';

-- 2. Remover trigger antigo se existir
DROP TRIGGER IF EXISTS sync_trial_ends_at_trigger ON public.subscriptions;

-- 3. Criar a função do trigger (garantir que existe)
CREATE OR REPLACE FUNCTION public.sync_trial_ends_at() 
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
AS $$
BEGIN
  IF NEW.status = 'trial' AND NEW.trial_end_date IS NOT NULL THEN
    UPDATE public.brokers 
    SET trial_ends_at = NEW.trial_end_date 
    WHERE id = NEW.broker_id;
  ELSIF NEW.status IN ('active', 'cancelled') THEN
    UPDATE public.brokers 
    SET trial_ends_at = NULL 
    WHERE id = NEW.broker_id;
  ELSIF NEW.status = 'expired' THEN
    UPDATE public.brokers 
    SET trial_ends_at = now() - INTERVAL '1 day' 
    WHERE id = NEW.broker_id;
  END IF;
  RETURN NEW;
END; 
$$;

-- 4. Criar o trigger
CREATE TRIGGER sync_trial_ends_at_trigger 
  AFTER INSERT OR UPDATE OF status, trial_end_date 
  ON public.subscriptions 
  FOR EACH ROW 
  EXECUTE FUNCTION public.sync_trial_ends_at();

-- 5. Verificar se o trigger foi criado com sucesso (deve retornar 1 linha)
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
  AND trigger_name = 'sync_trial_ends_at_trigger';

-- 6. Testar a sincronização manualmente em registros existentes
UPDATE public.brokers b
SET trial_ends_at = s.trial_end_date
FROM public.subscriptions s
WHERE s.broker_id = b.id 
  AND s.status = 'trial' 
  AND s.trial_end_date IS NOT NULL;

-- RESULTADO ESPERADO:
-- Query 1: 0 linhas (trigger não existe ainda)
-- Query 5: 1 linha mostrando o trigger criado
-- Query 6: X linhas atualizadas (número de brokers em trial que precisavam sincronização)
