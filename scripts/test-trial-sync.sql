-- Script de teste: Verificar sincronização do trial_ends_at
-- Execute após aplicar o script fix-missing-trigger.sql

-- 1. Ver status atual de brokers em trial
SELECT 
  b.id,
  b.business_name,
  b.email,
  b.trial_ends_at as broker_trial_ends_at,
  s.trial_end_date as subscription_trial_end_date,
  s.status as subscription_status,
  CASE 
    WHEN b.trial_ends_at = s.trial_end_date THEN '✅ SINCRONIZADO'
    WHEN b.trial_ends_at IS NULL AND s.trial_end_date IS NOT NULL THEN '❌ DESSINCRONIZADO (broker NULL)'
    WHEN b.trial_ends_at IS NOT NULL AND s.trial_end_date IS NULL THEN '❌ DESSINCRONIZADO (subscription NULL)'
    WHEN b.trial_ends_at != s.trial_end_date THEN '❌ DESSINCRONIZADO (datas diferentes)'
    ELSE '⚠️ ESTADO DESCONHECIDO'
  END as sync_status
FROM public.brokers b
LEFT JOIN public.subscriptions s ON s.broker_id = b.id
WHERE s.status = 'trial' OR b.trial_ends_at IS NOT NULL
ORDER BY b.created_at DESC;

-- 2. Simular uma atualização para testar o trigger
-- (Descomente as linhas abaixo para executar o teste)

-- BEGIN;
-- 
-- -- Criar um broker de teste
-- INSERT INTO public.brokers (user_id, business_name, owner_name, email, website_slug, is_active)
-- VALUES (
--   (SELECT id FROM auth.users LIMIT 1), -- Usar um user_id existente
--   'Teste Trial Sync',
--   'Admin Teste',
--   'teste-trigger-' || floor(random() * 1000000) || '@example.com',
--   'teste-trigger-' || floor(random() * 1000000),
--   true
-- )
-- RETURNING id;
-- 
-- -- Anote o ID retornado acima e substitua no comando abaixo
-- -- Chamar a função para criar subscription (substitua UUID_DO_BROKER_ACIMA)
-- SELECT initialize_subscription_trial('UUID_DO_BROKER_ACIMA');
-- 
-- -- Verificar se trial_ends_at foi sincronizado
-- SELECT 
--   b.trial_ends_at,
--   s.trial_end_date,
--   (b.trial_ends_at = s.trial_end_date) as is_synced
-- FROM public.brokers b
-- JOIN public.subscriptions s ON s.broker_id = b.id
-- WHERE b.id = 'UUID_DO_BROKER_ACIMA';
-- 
-- -- Se is_synced = true, o trigger está funcionando!
-- 
-- ROLLBACK; -- Desfaz o teste

-- 3. Contar registros dessincronizados
SELECT 
  COUNT(*) as total_dessincronizados
FROM public.brokers b
JOIN public.subscriptions s ON s.broker_id = b.id
WHERE s.status = 'trial' 
  AND (b.trial_ends_at IS NULL OR b.trial_ends_at != s.trial_end_date);

-- RESULTADOS ESPERADOS:
-- Query 1: Deve mostrar todos os brokers em trial com status de sincronização
-- Query 3: Deve retornar 0 após executar fix-missing-trigger.sql
