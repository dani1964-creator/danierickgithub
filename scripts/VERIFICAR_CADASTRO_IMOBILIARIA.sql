-- ============================================================================
-- SCRIPT DE VERIFICAÇÃO - SISTEMA DE CADASTRO DE IMOBILIÁRIA
-- ============================================================================
-- Execute este script no Supabase SQL Editor para diagnosticar possíveis problemas
-- Data: 2025-11-17
-- ============================================================================

DO $$ 
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '       DIAGNÓSTICO COMPLETO - SISTEMA DE CADASTRO';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- 1. VERIFICAR ESTRUTURA DA TABELA BROKERS
-- ============================================================================

DO $$ 
BEGIN
  RAISE NOTICE '🔍 PARTE 1: VERIFICANDO TABELA BROKERS';
  RAISE NOTICE '─────────────────────────────────────────────────────────────';
END $$;

-- 1.1 Verificar se coluna owner_name existe
SELECT 
  '1.1 Coluna owner_name:' as verificacao,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'brokers' AND column_name = 'owner_name'
  ) THEN '✅ EXISTE' ELSE '⚠️ NÃO EXISTE (não é problema - API usa display_name)' END as status;

-- 1.2 Verificar se coluna display_name existe
SELECT 
  '1.2 Coluna display_name:' as verificacao,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'brokers' AND column_name = 'display_name'
  ) THEN '✅ EXISTE (usado pela API)' ELSE '❌ NÃO EXISTE - PROBLEMA CRÍTICO!' END as status;

-- 1.3 Verificar colunas obrigatórias
SELECT 
  '1.3 Colunas obrigatórias:' as verificacao,
  string_agg(column_name, ', ') as colunas_existentes
FROM information_schema.columns 
WHERE table_name = 'brokers' 
  AND column_name IN ('id', 'user_id', 'business_name', 'display_name', 'email', 'website_slug', 'is_active', 'trial_ends_at');

-- 1.4 Verificar se RLS está habilitado
SELECT 
  '1.4 Row Level Security:' as verificacao,
  CASE WHEN relrowsecurity 
    THEN '✅ HABILITADO' 
    ELSE '❌ DESABILITADO - precisa habilitar!' 
  END as status
FROM pg_class 
WHERE relname = 'brokers';

-- ============================================================================
-- 2. VERIFICAR POLICIES RLS DE BROKERS
-- ============================================================================

DO $$ 
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🔍 PARTE 2: VERIFICANDO POLICIES RLS DE BROKERS';
  RAISE NOTICE '─────────────────────────────────────────────────────────────';
END $$;

-- 2.1 Verificar policy service_role (CRÍTICA para API)
SELECT 
  '2.1 Policy service_role_brokers_all:' as verificacao,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'brokers' 
      AND policyname = 'service_role_brokers_all'
      AND roles::text LIKE '%service_role%'
  ) THEN '✅ EXISTE (API pode inserir)' ELSE '❌ NÃO EXISTE - API VAI FALHAR!' END as status;

-- 2.2 Listar todas as policies INSERT
SELECT 
  '2.2 Policies INSERT em brokers:' as verificacao,
  COALESCE(string_agg(policyname, ', '), 'NENHUMA') as policies_insert
FROM pg_policies 
WHERE tablename = 'brokers' AND cmd = 'INSERT';

-- 2.3 Detalhes de todas as policies de brokers
SELECT 
  '2.3 DETALHES DE TODAS AS POLICIES:' as info,
  '' as espacamento;

SELECT 
  policyname as policy_nome,
  cmd as operacao,
  qual as usando_condicao,
  with_check as check_condicao,
  roles::text as roles
FROM pg_policies 
WHERE tablename = 'brokers'
ORDER BY cmd, policyname;

-- ============================================================================
-- 3. VERIFICAR TABELA SUBSCRIPTIONS
-- ============================================================================

DO $$ 
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🔍 PARTE 3: VERIFICANDO TABELA SUBSCRIPTIONS';
  RAISE NOTICE '─────────────────────────────────────────────────────────────';
END $$;

-- 3.1 Verificar colunas essenciais
SELECT 
  '3.1 Colunas subscriptions:' as verificacao,
  string_agg(column_name, ', ') as colunas_existentes
FROM information_schema.columns 
WHERE table_name = 'subscriptions' 
  AND column_name IN ('id', 'broker_id', 'plan_type', 'status', 'trial_start_date', 'trial_end_date');

-- 3.2 Verificar se RLS está habilitado
SELECT 
  '3.2 RLS em subscriptions:' as verificacao,
  CASE WHEN relrowsecurity 
    THEN '✅ HABILITADO' 
    ELSE '❌ DESABILITADO - precisa habilitar!' 
  END as status
FROM pg_class 
WHERE relname = 'subscriptions';

-- 3.3 Verificar policy service_role
SELECT 
  '3.3 Policy service_role_subscriptions_all:' as verificacao,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'subscriptions' 
      AND policyname = 'service_role_subscriptions_all'
      AND roles::text LIKE '%service_role%'
  ) THEN '✅ EXISTE' ELSE '❌ NÃO EXISTE - API VAI FALHAR!' END as status;

-- ============================================================================
-- 4. VERIFICAR FUNÇÃO initialize_subscription_trial
-- ============================================================================

DO $$ 
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🔍 PARTE 4: VERIFICANDO FUNÇÃO DE TRIAL';
  RAISE NOTICE '─────────────────────────────────────────────────────────────';
END $$;

-- 4.1 Verificar se função existe
SELECT 
  '4.1 Função initialize_subscription_trial:' as verificacao,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.routines 
    WHERE routine_schema = 'public'
      AND routine_name = 'initialize_subscription_trial'
  ) THEN '✅ EXISTE' ELSE '❌ NÃO EXISTE - PRECISA CRIAR!' END as status;

-- 4.2 Verificar assinatura da função
SELECT 
  '4.2 Assinatura da função:' as info,
  routine_name,
  data_type as retorno,
  routine_definition as definicao_truncada
FROM information_schema.routines 
WHERE routine_schema = 'public'
  AND routine_name = 'initialize_subscription_trial';

-- ============================================================================
-- 5. VERIFICAR TRIGGERS
-- ============================================================================

DO $$ 
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🔍 PARTE 5: VERIFICANDO TRIGGERS';
  RAISE NOTICE '─────────────────────────────────────────────────────────────';
END $$;

-- 5.1 Trigger de sincronização (desejável)
SELECT 
  '5.1 Trigger sync_trial_ends_at_trigger:' as verificacao,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'sync_trial_ends_at_trigger'
      AND event_object_table = 'subscriptions'
  ) THEN '✅ EXISTE (mantém trial_ends_at sincronizado)' 
    ELSE '⚠️ NÃO EXISTE (não é crítico)' 
  END as status;

-- 5.2 Trigger automático (INDESEJÁVEL - causa duplicação)
SELECT 
  '5.2 Trigger trigger_create_subscription_for_new_broker:' as verificacao,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'trigger_create_subscription_for_new_broker'
  ) THEN '❌ EXISTE - REMOVE! (causa subscription duplicada)' 
    ELSE '✅ NÃO EXISTE (correto)' 
  END as status;

-- 5.3 Listar todos os triggers ativos
SELECT 
  '5.3 TODOS OS TRIGGERS ATIVOS:' as info,
  '' as espacamento;

SELECT 
  trigger_name,
  event_object_table as tabela,
  action_timing as quando,
  event_manipulation as evento
FROM information_schema.triggers 
WHERE event_object_schema = 'public'
  AND event_object_table IN ('brokers', 'subscriptions')
ORDER BY event_object_table, trigger_name;

-- ============================================================================
-- 6. TESTAR PERMISSÕES DO SERVICE ROLE
-- ============================================================================

DO $$ 
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🔍 PARTE 6: TESTANDO PERMISSÕES';
  RAISE NOTICE '─────────────────────────────────────────────────────────────';
END $$;

-- 6.1 Verificar grants na tabela brokers
SELECT 
  '6.1 Grants em brokers:' as info,
  '' as espacamento;

SELECT 
  grantee,
  privilege_type
FROM information_schema.role_table_grants 
WHERE table_name = 'brokers'
  AND grantee IN ('service_role', 'authenticated', 'anon')
ORDER BY grantee, privilege_type;

-- 6.2 Verificar grants na tabela subscriptions
SELECT 
  '6.2 Grants em subscriptions:' as info,
  '' as espacamento;

SELECT 
  grantee,
  privilege_type
FROM information_schema.role_table_grants 
WHERE table_name = 'subscriptions'
  AND grantee IN ('service_role', 'authenticated', 'anon')
ORDER BY grantee, privilege_type;

-- ============================================================================
-- 7. VERIFICAR INTEGRIDADE DOS DADOS
-- ============================================================================

DO $$ 
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🔍 PARTE 7: VERIFICANDO INTEGRIDADE DOS DADOS';
  RAISE NOTICE '─────────────────────────────────────────────────────────────';
END $$;

-- 7.1 Contar brokers sem display_name
SELECT 
  '7.1 Brokers sem display_name:' as verificacao,
  COUNT(*) as quantidade,
  CASE WHEN COUNT(*) = 0 
    THEN '✅ Todos OK' 
    ELSE '⚠️ Alguns brokers sem nome' 
  END as status
FROM public.brokers 
WHERE display_name IS NULL OR display_name = '';

-- 7.2 Contar brokers sem subscription
SELECT 
  '7.2 Brokers sem subscription:' as verificacao,
  COUNT(*) as quantidade,
  CASE WHEN COUNT(*) = 0 
    THEN '✅ Todos têm subscription' 
    ELSE '⚠️ Alguns sem subscription' 
  END as status
FROM public.brokers b
WHERE NOT EXISTS (
  SELECT 1 FROM public.subscriptions s WHERE s.broker_id = b.id
);

-- 7.3 Verificar subscriptions duplicadas
SELECT 
  '7.3 Brokers com subscription duplicada:' as verificacao,
  COUNT(*) as quantidade,
  CASE WHEN COUNT(*) = 0 
    THEN '✅ Sem duplicações' 
    ELSE '❌ HÁ DUPLICAÇÕES!' 
  END as status
FROM (
  SELECT broker_id, COUNT(*) as total
  FROM public.subscriptions
  GROUP BY broker_id
  HAVING COUNT(*) > 1
) duplicados;

-- ============================================================================
-- 8. RESUMO E RECOMENDAÇÕES
-- ============================================================================

DO $$ 
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '                    RESUMO DO DIAGNÓSTICO';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '✅ = OK | ⚠️ = Atenção | ❌ = Problema Crítico';
  RAISE NOTICE '';
  RAISE NOTICE '📋 VERIFICAÇÕES CRÍTICAS PARA O CADASTRO FUNCIONAR:';
  RAISE NOTICE '';
  RAISE NOTICE '1. Coluna display_name em brokers deve existir ✓';
  RAISE NOTICE '2. Policy service_role_brokers_all deve existir ✓';
  RAISE NOTICE '3. Policy service_role_subscriptions_all deve existir ✓';
  RAISE NOTICE '4. Função initialize_subscription_trial deve existir ✓';
  RAISE NOTICE '5. RLS habilitado em brokers e subscriptions ✓';
  RAISE NOTICE '6. Trigger automático NÃO deve existir ✓';
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- FIM DO SCRIPT DE VERIFICAÇÃO
-- ============================================================================
