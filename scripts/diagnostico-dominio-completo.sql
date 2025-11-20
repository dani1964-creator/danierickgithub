-- ============================================================================
-- DIAGNÓSTICO COMPLETO: Sistema de Domínios Personalizados
-- ============================================================================
-- Execute este script no Supabase SQL Editor para verificar todo o sistema
-- ============================================================================

-- 1. VERIFICAR ESTRUTURA DAS TABELAS
-- ============================================================================
SELECT 'Verificando estrutura da tabela dns_zones' AS etapa;

SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'dns_zones'
) AS dns_zones_existe;

-- Verificar colunas da dns_zones
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'dns_zones'
ORDER BY ordinal_position;

-- ============================================================================
-- 2. VERIFICAR DADOS ATUAIS
-- ============================================================================
SELECT 'Verificando zonas DNS cadastradas' AS etapa;

SELECT 
  id,
  broker_id,
  domain,
  status,
  nameservers,
  verification_attempts,
  last_verification_at,
  activated_at,
  created_at
FROM dns_zones
ORDER BY created_at DESC;

-- ============================================================================
-- 3. VERIFICAR BROKERS COM ZONAS
-- ============================================================================
SELECT 'Verificando relação brokers <-> dns_zones' AS etapa;

SELECT 
  b.id AS broker_id,
  b.name AS broker_name,
  b.custom_domain AS broker_custom_domain,
  b.subdomain AS broker_subdomain,
  z.domain AS zona_domain,
  z.status AS zona_status,
  z.activated_at AS zona_ativada_em,
  CASE 
    WHEN b.custom_domain = z.domain THEN '✅ Sincronizado'
    WHEN b.custom_domain IS NULL AND z.status = 'active' THEN '❌ Zona ativa mas broker sem custom_domain'
    WHEN b.custom_domain IS NOT NULL AND z.domain IS NULL THEN '⚠️ Broker com custom_domain mas sem zona'
    ELSE '⚠️ Desincronizado'
  END AS status_sincronizacao
FROM brokers b
LEFT JOIN dns_zones z ON b.id = z.broker_id
WHERE z.domain IS NOT NULL OR b.custom_domain IS NOT NULL
ORDER BY b.created_at DESC;

-- ============================================================================
-- 4. VERIFICAR TRIGGERS E FUNÇÕES
-- ============================================================================
SELECT 'Verificando funções de sincronização' AS etapa;

SELECT 
  routine_name,
  routine_type,
  CASE 
    WHEN routine_name LIKE '%sync_custom_domain%' THEN '✅ Função de sync existe'
    ELSE 'Outra função'
  END AS tipo
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE '%sync%domain%';

-- Verificar triggers
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table = 'dns_zones';

-- ============================================================================
-- 5. VERIFICAR REGISTROS DNS
-- ============================================================================
SELECT 'Verificando registros DNS criados' AS etapa;

SELECT 
  dr.id,
  dz.domain AS zona,
  dr.record_type,
  dr.name,
  dr.value,
  dr.ttl,
  dr.created_at
FROM dns_records dr
JOIN dns_zones dz ON dr.zone_id = dz.id
ORDER BY dz.domain, dr.record_type;

-- ============================================================================
-- 6. IDENTIFICAR PROBLEMAS COMUNS
-- ============================================================================
SELECT 'Identificando problemas comuns' AS etapa;

-- Zonas ativas mas broker sem custom_domain
SELECT 
  '❌ Zona ativa sem custom_domain no broker' AS problema,
  z.domain,
  z.status,
  z.activated_at,
  b.id AS broker_id,
  b.name AS broker_name,
  b.custom_domain
FROM dns_zones z
JOIN brokers b ON z.broker_id = b.id
WHERE z.status = 'active' 
  AND (b.custom_domain IS NULL OR b.custom_domain != z.domain);

-- Zonas há muito tempo em verifying
SELECT 
  '⚠️ Zona em verifying há muito tempo' AS problema,
  domain,
  status,
  verification_attempts,
  last_verification_at,
  EXTRACT(EPOCH FROM (NOW() - created_at))/3600 AS horas_desde_criacao
FROM dns_zones
WHERE status = 'verifying'
  AND created_at < NOW() - INTERVAL '2 hours';

-- Zonas sem registros DNS
SELECT 
  '⚠️ Zona sem registros DNS' AS problema,
  z.domain,
  z.status,
  COUNT(dr.id) AS total_registros
FROM dns_zones z
LEFT JOIN dns_records dr ON z.zone_id = dr.zone_id
GROUP BY z.id, z.domain, z.status
HAVING COUNT(dr.id) = 0;

-- ============================================================================
-- 7. TESTAR TRIGGER MANUALMENTE
-- ============================================================================
SELECT 'Para testar trigger, execute o seguinte UPDATE:' AS instrucao;

-- Este UPDATE deve atualizar automaticamente o custom_domain do broker
-- UPDATE dns_zones 
-- SET status = 'active', activated_at = NOW() 
-- WHERE domain = 'SEU_DOMINIO_AQUI';

-- Depois verifique se o broker foi atualizado:
-- SELECT custom_domain FROM brokers WHERE id = 'BROKER_ID_AQUI';

-- ============================================================================
-- 8. RESUMO FINAL
-- ============================================================================
SELECT 'Resumo do sistema' AS etapa;

SELECT 
  COUNT(*) FILTER (WHERE status = 'active') AS zonas_ativas,
  COUNT(*) FILTER (WHERE status = 'verifying') AS zonas_verificando,
  COUNT(*) FILTER (WHERE status = 'failed') AS zonas_falhas,
  COUNT(*) FILTER (WHERE status = 'pending') AS zonas_pendentes,
  COUNT(*) AS total_zonas
FROM dns_zones;

SELECT 
  COUNT(*) FILTER (WHERE custom_domain IS NOT NULL) AS brokers_com_custom_domain,
  COUNT(*) AS total_brokers
FROM brokers;
