-- ============================================================================
-- DIAGNÓSTICO E CORREÇÃO - ERRO AO CRIAR IMOBILIÁRIA
-- ============================================================================
-- Execute este script para diagnosticar e corrigir problemas no cadastro
-- Data: 2025-11-16
-- ============================================================================

-- ============================================================================
-- PARTE 1: DIAGNÓSTICO
-- ============================================================================

-- 1. Verificar se a função initialize_subscription_trial existe
SELECT 
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name = 'initialize_subscription_trial';

-- 2. Verificar se o trigger sync_trial_ends_at_trigger existe
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
  AND trigger_name = 'sync_trial_ends_at_trigger';

-- 3. Verificar estrutura da tabela brokers
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'brokers'
  AND column_name IN ('user_id', 'business_name', 'owner_name', 'email', 'website_slug', 'is_active', 'trial_ends_at')
ORDER BY ordinal_position;

-- 4. Verificar estrutura da tabela subscriptions
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'subscriptions'
  AND column_name IN ('broker_id', 'plan_type', 'status', 'trial_start_date', 'trial_end_date')
ORDER BY ordinal_position;

-- ============================================================================
-- PARTE 2: CORREÇÃO - Recriar função initialize_subscription_trial
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
  IF EXISTS (SELECT 1 FROM public.subscriptions WHERE broker_id = broker_uuid) THEN
    RAISE EXCEPTION 'Broker já possui assinatura ativa';
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
  
  RETURN subscription_id;
END; 
$$;

-- ============================================================================
-- PARTE 3: CORREÇÃO - Recriar trigger de sincronização
-- ============================================================================

-- Criar função do trigger
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

-- Remover trigger antigo se existir
DROP TRIGGER IF EXISTS sync_trial_ends_at_trigger ON public.subscriptions;

-- Criar novo trigger
CREATE TRIGGER sync_trial_ends_at_trigger 
  AFTER INSERT OR UPDATE OF status, trial_end_date 
  ON public.subscriptions 
  FOR EACH ROW 
  EXECUTE FUNCTION public.sync_trial_ends_at();

-- ============================================================================
-- PARTE 4: GARANTIR POLÍTICAS RLS CORRETAS
-- ============================================================================

-- Habilitar RLS na tabela brokers
ALTER TABLE public.brokers ENABLE ROW LEVEL SECURITY;

-- Limpar policies antigas
DROP POLICY IF EXISTS "Brokers podem ver seus próprios dados" ON brokers;
DROP POLICY IF EXISTS "Usuários podem criar broker via signup" ON brokers;
DROP POLICY IF EXISTS "Super admin pode ver todos os brokers" ON brokers;

-- Policy: Brokers veem seus próprios dados
CREATE POLICY "Brokers podem ver seus próprios dados"
ON brokers
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM brokers 
    WHERE user_id = auth.uid() 
    AND is_super_admin = true
  )
);

-- Policy: Permitir criação de broker (necessário para cadastro)
CREATE POLICY "Service role pode criar brokers"
ON brokers
FOR INSERT
TO service_role
WITH CHECK (true);

-- Policy: Brokers podem atualizar seus próprios dados
CREATE POLICY "Brokers podem atualizar seus próprios dados"
ON brokers
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- PARTE 5: VERIFICAÇÃO FINAL
-- ============================================================================

-- Verificar função criada
SELECT 'Função initialize_subscription_trial:' as verificacao,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.routines 
    WHERE routine_name = 'initialize_subscription_trial'
  ) THEN '✅ OK' ELSE '❌ NÃO ENCONTRADA' END as status;

-- Verificar trigger criado
SELECT 'Trigger sync_trial_ends_at_trigger:' as verificacao,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'sync_trial_ends_at_trigger'
  ) THEN '✅ OK' ELSE '❌ NÃO ENCONTRADO' END as status;

-- Verificar policies
SELECT 'Policies da tabela brokers:' as verificacao,
  COUNT(*)::text || ' policies' as status
FROM pg_policies 
WHERE tablename = 'brokers';

-- ============================================================================
-- TESTE MANUAL (OPCIONAL)
-- ============================================================================
-- Descomente as linhas abaixo para testar manualmente a criação:

-- BEGIN;
-- 
-- -- Simular criação de broker
-- INSERT INTO brokers (user_id, business_name, owner_name, email, website_slug, is_active)
-- VALUES (
--   (SELECT id FROM auth.users LIMIT 1),
--   'Teste Imobiliária',
--   'Admin Teste',
--   'teste-' || floor(random() * 1000000) || '@example.com',
--   'teste-' || floor(random() * 1000000),
--   true
-- )
-- RETURNING id;
-- 
-- -- Copie o ID retornado e substitua abaixo
-- SELECT initialize_subscription_trial('ID_DO_BROKER_AQUI');
-- 
-- -- Verificar se funcionou
-- SELECT b.business_name, b.trial_ends_at, s.status, s.trial_end_date
-- FROM brokers b
-- JOIN subscriptions s ON s.broker_id = b.id
-- WHERE b.id = 'ID_DO_BROKER_AQUI';
-- 
-- ROLLBACK;

-- ============================================================================
-- FIM DO SCRIPT
-- ============================================================================
