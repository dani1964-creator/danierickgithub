-- Script de verificação: Sistema de registro e trial
-- Execute este script no Supabase SQL Editor para verificar se tudo está configurado

-- 1. Verificar se a coluna trial_ends_at existe na tabela brokers
SELECT 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'brokers' 
  AND column_name = 'trial_ends_at';

-- 2. Verificar se a função initialize_subscription_trial existe
SELECT 
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name = 'initialize_subscription_trial';

-- 3. Verificar se o trigger sync_trial_ends_at_trigger existe
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
  AND trigger_name = 'sync_trial_ends_at_trigger';

-- 4. Verificar se a função do trigger existe
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name = 'sync_trial_ends_at';

-- 5. Listar todas as migrations aplicadas
SELECT 
  version,
  name
FROM supabase_migrations.schema_migrations 
WHERE version IN ('20251115000000', '20251116000000', '20251116000001')
ORDER BY version;

-- RESULTADO ESPERADO:
-- Query 1: Deve retornar 1 linha mostrando trial_ends_at (timestamp with time zone, nullable)
-- Query 2: Deve retornar 1 linha mostrando initialize_subscription_trial (function, USER-DEFINED)
-- Query 3: Deve retornar 1 linha mostrando sync_trial_ends_at_trigger (UPDATE, subscriptions)
-- Query 4: Deve retornar 1 linha mostrando sync_trial_ends_at (function)
-- Query 5: Deve retornar 3 linhas com as migrations 20251115000000, 20251116000000, 20251116000001
