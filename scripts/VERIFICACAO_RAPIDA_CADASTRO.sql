-- ============================================================================
-- VERIFICAÇÃO RÁPIDA - CADASTRO DE IMOBILIÁRIA
-- ============================================================================
-- Execute no Supabase SQL Editor
-- ============================================================================

DO $$ 
BEGIN
  RAISE NOTICE '🔍 VERIFICAÇÃO RÁPIDA - SISTEMA DE CADASTRO';
  RAISE NOTICE '══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
END $$;

-- 1. Verificar coluna display_name (CRÍTICO)
SELECT 
  'Coluna display_name em brokers:' as verificacao,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'brokers' AND column_name = 'display_name'
  ) THEN '✅ EXISTE' ELSE '❌ NÃO EXISTE - ERRO!' END as status;

-- 2. Verificar função initialize_subscription_trial (CRÍTICO)
SELECT 
  'Função initialize_subscription_trial:' as verificacao,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'initialize_subscription_trial'
  ) THEN '✅ EXISTE' ELSE '❌ NÃO EXISTE - CRIAR!' END as status;

-- 3. Verificar policy service_role em brokers (CRÍTICO)
SELECT 
  'Policy service_role_brokers_all:' as verificacao,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'brokers' 
      AND policyname = 'service_role_brokers_all'
  ) THEN '✅ EXISTE' ELSE '❌ NÃO EXISTE - CRIAR!' END as status;

-- 4. Verificar policy service_role em subscriptions (CRÍTICO)
SELECT 
  'Policy service_role_subscriptions_all:' as verificacao,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'subscriptions' 
      AND policyname = 'service_role_subscriptions_all'
  ) THEN '✅ EXISTE' ELSE '❌ NÃO EXISTE - CRIAR!' END as status;

-- 5. Verificar RLS habilitado
SELECT 
  'RLS em brokers:' as verificacao,
  CASE WHEN relrowsecurity 
    THEN '✅ HABILITADO' 
    ELSE '⚠️ DESABILITADO' 
  END as status
FROM pg_class 
WHERE relname = 'brokers';

SELECT 
  'RLS em subscriptions:' as verificacao,
  CASE WHEN relrowsecurity 
    THEN '✅ HABILITADO' 
    ELSE '⚠️ DESABILITADO' 
  END as status
FROM pg_class 
WHERE relname = 'subscriptions';

DO $$ 
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '══════════════════════════════════════════════════════════';
  RAISE NOTICE 'Se algum item está ❌, execute o script de correção!';
  RAISE NOTICE '══════════════════════════════════════════════════════════';
END $$;
