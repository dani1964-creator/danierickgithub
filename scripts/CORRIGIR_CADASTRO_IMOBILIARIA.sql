-- ============================================================================
-- CORREÇÃO COMPLETA - ERRO AO CRIAR IMOBILIÁRIA
-- ============================================================================
-- Execute este script AGORA no Supabase SQL Editor
-- Data: 2025-11-16
-- Problema: Cadastro de nova imobiliária falhando com "Erro ao criar imobiliária"
-- ============================================================================

-- ============================================================================
-- PARTE 1: DIAGNÓSTICO INICIAL
-- ============================================================================

DO $$ 
BEGIN
  RAISE NOTICE '=== INICIANDO DIAGNÓSTICO ===';
END $$;

-- 1.1 Verificar se coluna owner_name existe
SELECT 
  'Coluna owner_name:' as verificacao,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'brokers' AND column_name = 'owner_name'
  ) THEN '✅ EXISTE' ELSE '❌ NÃO EXISTE (será criada)' END as status;

-- 1.2 Verificar função initialize_subscription_trial
SELECT 
  'Função initialize_subscription_trial:' as verificacao,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.routines 
    WHERE routine_name = 'initialize_subscription_trial'
  ) THEN '✅ EXISTE' ELSE '❌ NÃO EXISTE (será criada)' END as status;

-- 1.3 Verificar trigger sync_trial_ends_at_trigger
SELECT 
  'Trigger sync_trial_ends_at_trigger:' as verificacao,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'sync_trial_ends_at_trigger'
  ) THEN '✅ EXISTE' ELSE '❌ NÃO EXISTE (será criado)' END as status;

-- 1.4 Verificar trigger automático de subscription (causa duplicação)
SELECT 
  'Trigger trigger_create_subscription_for_new_broker:' as verificacao,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'trigger_create_subscription_for_new_broker'
  ) THEN '⚠️ EXISTE (será removido - causa conflito)' ELSE '✅ NÃO EXISTE' END as status;

-- 1.5 Listar policies RLS de brokers para INSERT
SELECT 
  'Policies INSERT na tabela brokers:' as verificacao,
  string_agg(policyname, ', ') as policies_existentes
FROM pg_policies 
WHERE tablename = 'brokers' AND cmd = 'INSERT';

-- ============================================================================
-- PARTE 2: ADICIONAR COLUNA owner_name (se não existir)
-- ============================================================================

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'brokers' AND column_name = 'owner_name'
  ) THEN
    ALTER TABLE public.brokers ADD COLUMN owner_name TEXT;
    RAISE NOTICE '✅ Coluna owner_name adicionada à tabela brokers';
  ELSE
    RAISE NOTICE '⚠️ Coluna owner_name já existe';
  END IF;
END $$;

-- ============================================================================
-- PARTE 3: REMOVER TRIGGER AUTOMÁTICO (causa duplicação)
-- ============================================================================

-- Remover trigger que cria subscription automaticamente
-- Esse trigger causa conflito com a chamada manual da API
DROP TRIGGER IF EXISTS trigger_create_subscription_for_new_broker ON public.brokers;
DROP FUNCTION IF EXISTS public.create_subscription_for_new_broker();

DO $$ 
BEGIN
  RAISE NOTICE '✅ Trigger automático removido (evita criação duplicada de subscription)';
END $$;

-- ============================================================================
-- PARTE 4: RECRIAR FUNÇÃO initialize_subscription_trial
-- ============================================================================
-- Modificada para NÃO FALHAR se subscription já existe (retorna ID existente)

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
    -- Se já existe, apenas retornar o ID existente (não falhar)
    SELECT id INTO subscription_id FROM public.subscriptions WHERE broker_id = broker_uuid LIMIT 1;
    RAISE NOTICE 'Subscription já existe para broker %, retornando ID existente', broker_uuid;
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
  
  RAISE NOTICE '✅ Subscription criada para broker %', broker_uuid;
  RETURN subscription_id;
END; 
$$;

COMMENT ON FUNCTION public.initialize_subscription_trial IS 
'Inicializa período de teste de 30 dias. Não falha se subscription já existe (retorna ID existente).';

DO $$ 
BEGIN
  RAISE NOTICE '✅ Função initialize_subscription_trial recriada';
END $$;

-- ============================================================================
-- PARTE 5: RECRIAR TRIGGER DE SINCRONIZAÇÃO
-- ============================================================================

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

DROP TRIGGER IF EXISTS sync_trial_ends_at_trigger ON public.subscriptions;

CREATE TRIGGER sync_trial_ends_at_trigger 
  AFTER INSERT OR UPDATE OF status, trial_end_date 
  ON public.subscriptions 
  FOR EACH ROW 
  EXECUTE FUNCTION public.sync_trial_ends_at();

DO $$ 
BEGIN
  RAISE NOTICE '✅ Trigger de sincronização recriado';
END $$;

-- ============================================================================
-- PARTE 6: CORRIGIR RLS POLICIES DE BROKERS
-- ============================================================================

-- Habilitar RLS
ALTER TABLE public.brokers ENABLE ROW LEVEL SECURITY;

-- Remover policies antigas que podem causar conflito
DROP POLICY IF EXISTS "Users can create their broker profile" ON public.brokers;
DROP POLICY IF EXISTS "Authenticated users can create broker profile" ON public.brokers;
DROP POLICY IF EXISTS "Service role pode criar brokers" ON public.brokers;
DROP POLICY IF EXISTS "Public can insert brokers" ON public.brokers;
DROP POLICY IF EXISTS "public_brokers_insert" ON public.brokers;

-- Policy 1: SERVICE ROLE tem acesso total (necessário para API routes)
CREATE POLICY "service_role_brokers_all"
  ON public.brokers
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy 2: AUTHENTICATED pode criar seu próprio perfil
CREATE POLICY "authenticated_brokers_insert"
  ON public.brokers
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Policy 3: AUTHENTICATED pode ver seu próprio perfil
DROP POLICY IF EXISTS "Brokers can view their own profile" ON public.brokers;
DROP POLICY IF EXISTS "Authenticated brokers can view own profile" ON public.brokers;
DROP POLICY IF EXISTS "authenticated_brokers_select_own" ON public.brokers;

CREATE POLICY "authenticated_brokers_select"
  ON public.brokers
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy 4: AUTHENTICATED pode atualizar seu próprio perfil
DROP POLICY IF EXISTS "Brokers can update their own profile" ON public.brokers;
DROP POLICY IF EXISTS "Authenticated brokers can update own profile" ON public.brokers;
DROP POLICY IF EXISTS "authenticated_brokers_update_own" ON public.brokers;

CREATE POLICY "authenticated_brokers_update"
  ON public.brokers
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DO $$ 
BEGIN
  RAISE NOTICE '✅ Policies RLS de brokers corrigidas';
END $$;

-- ============================================================================
-- PARTE 7: CORRIGIR RLS POLICIES DE SUBSCRIPTIONS
-- ============================================================================

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Garantir que service_role pode inserir/atualizar
DROP POLICY IF EXISTS "service_role_subscriptions_all" ON public.subscriptions;

CREATE POLICY "service_role_subscriptions_all"
  ON public.subscriptions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DO $$ 
BEGIN
  RAISE NOTICE '✅ Policies RLS de subscriptions corrigidas';
END $$;

-- ============================================================================
-- PARTE 8: VERIFICAÇÃO FINAL
-- ============================================================================

DO $$ 
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== VERIFICAÇÃO FINAL ===';
END $$;

-- Verificar coluna owner_name
SELECT 
  'Coluna owner_name:' as verificacao,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'brokers' AND column_name = 'owner_name'
  ) THEN '✅ OK' ELSE '❌ FALTA' END as status;

-- Verificar função
SELECT 
  'Função initialize_subscription_trial:' as verificacao,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.routines 
    WHERE routine_name = 'initialize_subscription_trial'
  ) THEN '✅ OK' ELSE '❌ FALTA' END as status;

-- Verificar trigger de sync
SELECT 
  'Trigger sync_trial_ends_at_trigger:' as verificacao,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'sync_trial_ends_at_trigger'
  ) THEN '✅ OK' ELSE '❌ FALTA' END as status;

-- Verificar que trigger automático foi removido
SELECT 
  'Trigger automático REMOVIDO:' as verificacao,
  CASE WHEN NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'trigger_create_subscription_for_new_broker'
  ) THEN '✅ OK (removido com sucesso)' ELSE '❌ AINDA EXISTE' END as status;

-- Verificar policies de brokers
SELECT 
  'Policy service_role em brokers:' as verificacao,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'brokers' AND policyname = 'service_role_brokers_all'
  ) THEN '✅ OK' ELSE '❌ FALTA' END as status;

-- Verificar policies de subscriptions
SELECT 
  'Policy service_role em subscriptions:' as verificacao,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'subscriptions' AND policyname = 'service_role_subscriptions_all'
  ) THEN '✅ OK' ELSE '❌ FALTA' END as status;

DO $$ 
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅✅✅ CORREÇÃO COMPLETA APLICADA COM SUCESSO ✅✅✅';
  RAISE NOTICE '';
  RAISE NOTICE '📋 PRÓXIMOS PASSOS:';
  RAISE NOTICE '1. Acesse o frontend em /cadastro';
  RAISE NOTICE '2. Preencha o formulário de cadastro';
  RAISE NOTICE '3. Clique em "Começar Teste Grátis de 30 Dias"';
  RAISE NOTICE '4. Verifique se o cadastro completa sem erros';
  RAISE NOTICE '5. Faça login com as credenciais criadas';
  RAISE NOTICE '';
  RAISE NOTICE '🔍 Se ainda houver erro:';
  RAISE NOTICE '- Abra o console do navegador (F12)';
  RAISE NOTICE '- Veja a mensagem de erro completa';
  RAISE NOTICE '- Verifique os logs do Supabase em Dashboard > Logs';
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- FIM DO SCRIPT
-- ============================================================================
