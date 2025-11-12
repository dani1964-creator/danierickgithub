-- ============================================================================
-- OTIMIZAÇÕES OPCIONAIS - Banco de Dados
-- ============================================================================
-- Baseado na análise do verify-database-health.sql
-- Estas otimizações NÃO são urgentes, mas podem melhorar performance e manutenção
-- ============================================================================

-- ============================================================================
-- 1. RLS POLICIES REDUNDANTES
-- ============================================================================
-- Problema: Múltiplas policies fazendo a mesma coisa

-- 1.1. Consolidar SELECT para authenticated (2 policies duplicadas)
-- ATUAL:
--   - owner_read_broker: (user_id = auth.uid())
--   - brokers_owner_select: (user_id = auth.uid())
-- SUGESTÃO: Manter apenas uma

-- 1.2. Consolidar UPDATE para authenticated (2 policies duplicadas)
-- ATUAL:
--   - owner_update_broker: (user_id = auth.uid())
--   - Authenticated brokers can update own profile: (user_id = auth.uid())
-- SUGESTÃO: Manter apenas uma

-- 1.3. Consolidar SELECT para anon (2 policies duplicadas)
-- ATUAL:
--   - public_brokers_read: (status='active' AND is_active=true)
--   - brokers_anon_select_active: (is_active=true)
-- SUGESTÃO: Verificar qual é mais restritiva e manter apenas ela

-- ⚠️ ATENÇÃO: NÃO EXECUTE ESTAS MUDANÇAS SEM TESTAR EM DEV PRIMEIRO!
-- Pode quebrar acesso se remover a policy errada

-- ============================================================================
-- 2. ÍNDICES REDUNDANTES
-- ============================================================================
-- Problema: Múltiplos índices na mesma coluna desperdiçam espaço

-- 2.1. BROKERS - user_id duplicado
-- ATUAL:
--   - idx_brokers_user (user_id)
--   - idx_brokers_user_id (user_id)
-- SUGESTÃO: Remover um deles
-- DROP INDEX IF EXISTS idx_brokers_user; -- Mantém idx_brokers_user_id

-- 2.2. BROKERS - website_slug múltiplos índices
-- ATUAL:
--   - brokers_website_slug_unique (UNIQUE)
--   - idx_brokers_website_slug (simples)
--   - idx_brokers_active_slug (website_slug, is_active)
--   - uq_brokers_website_slug (UNIQUE WHERE NOT NULL)
-- SUGESTÃO: UNIQUE já cria índice, não precisa do simples
-- DROP INDEX IF EXISTS idx_brokers_website_slug; -- UNIQUE já indexa

-- 2.3. BROKERS - subdomain múltiplos índices
-- ATUAL:
--   - brokers_subdomain_unique (UNIQUE)
--   - idx_brokers_subdomain (WHERE subdomain IS NOT NULL)
--   - idx_brokers_subdomain_unique (UNIQUE)
--   - ux_brokers_subdomain (UNIQUE lower(subdomain))
-- SUGESTÃO: Consolidar, manter apenas UNIQUE lower() e parcial WHERE NOT NULL

-- 2.4. LEADS - broker_id duplicado
-- ATUAL:
--   - idx_leads_broker (broker_id)
--   - idx_leads_broker_id (broker_id)
-- SUGESTÃO: Remover um deles
-- DROP INDEX IF EXISTS idx_leads_broker; -- Mantém idx_leads_broker_id

-- 2.5. LEADS - property_id duplicado
-- ATUAL:
--   - idx_leads_property (property_id)
--   - idx_leads_property_id (property_id)
-- SUGESTÃO: Remover um deles
-- DROP INDEX IF EXISTS idx_leads_property; -- Mantém idx_leads_property_id

-- 2.6. PROPERTIES - broker_id duplicado
-- ATUAL:
--   - idx_properties_broker (broker_id)
--   - idx_properties_broker_id (broker_id)
-- SUGESTÃO: Remover um deles
-- DROP INDEX IF EXISTS idx_properties_broker; -- Mantém idx_properties_broker_id

-- 2.7. REALTORS - broker_id duplicado
-- ATUAL:
--   - idx_realtors_broker (broker_id)
--   - idx_realtors_broker_id (broker_id)
-- SUGESTÃO: Remover um deles
-- DROP INDEX IF EXISTS idx_realtors_broker; -- Mantém idx_realtors_broker_id

-- ============================================================================
-- 3. SCRIPT PARA REMOVER ÍNDICES REDUNDANTES (OPCIONAL)
-- ============================================================================
-- ⚠️ APENAS EXECUTE APÓS VALIDAR QUE NÃO VAI QUEBRAR QUERIES!
-- ⚠️ FAÇA BACKUP ANTES!

-- BEGIN;

-- -- Remover duplicatas de user_id
-- DROP INDEX IF EXISTS public.idx_brokers_user;

-- -- Remover duplicatas de website_slug simples (UNIQUE já indexa)
-- DROP INDEX IF EXISTS public.idx_brokers_website_slug;

-- -- Remover duplicatas de broker_id em várias tabelas
-- DROP INDEX IF EXISTS public.idx_leads_broker;
-- DROP INDEX IF EXISTS public.idx_properties_broker;
-- DROP INDEX IF EXISTS public.idx_realtors_broker;

-- -- Remover duplicatas de property_id
-- DROP INDEX IF EXISTS public.idx_leads_property;

-- -- Verificar índices restantes
-- SELECT tablename, indexname, indexdef
-- FROM pg_indexes
-- WHERE schemaname = 'public'
--   AND tablename IN ('brokers', 'properties', 'leads', 'realtors')
-- ORDER BY tablename, indexname;

-- COMMIT;

-- ============================================================================
-- 4. MONITORAMENTO DE PERFORMANCE
-- ============================================================================
-- Verificar quais índices estão sendo realmente usados

-- SELECT 
--     schemaname,
--     tablename,
--     indexname,
--     idx_scan as index_scans,
--     idx_tup_read as tuples_read,
--     idx_tup_fetch as tuples_fetched
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public'
--   AND tablename IN ('brokers', 'properties', 'leads', 'realtors')
-- ORDER BY idx_scan DESC;

-- ============================================================================
-- 5. AÇÕES PRIORITÁRIAS PARA LEADS
-- ============================================================================
-- Você tem 30 leads novos sem contato! 

-- Ver leads mais recentes
SELECT 
    id,
    name,
    email,
    phone,
    message,
    status,
    created_at,
    (SELECT title FROM properties WHERE id = leads.property_id) as property_title
FROM public.leads
WHERE broker_id = '1e7b21c7-1727-4741-8b89-dcddc406ce06'
  AND status = 'new'
ORDER BY created_at DESC
LIMIT 10;

-- ============================================================================
-- RESUMO DAS OTIMIZAÇÕES:
-- ============================================================================
-- 🟢 URGENTE: 
--    - Corrigir subdomain (arquivo: fix-rfimobiliaria-subdomain.sql)
--
-- 🟡 RECOMENDADO:
--    - Contatar os 30 leads novos
--
-- 🔵 OPCIONAL (quando tiver tempo):
--    - Limpar índices redundantes (economiza espaço)
--    - Consolidar RLS policies (facilita manutenção)
--    - Monitorar uso de índices com pg_stat_user_indexes
-- ============================================================================
