-- Script de Verificação de Integridade do Supabase
-- Execute este script para verificar se as tabelas e funções estão funcionando corretamente

-- ========================================
-- 1. VERIFICAR ESTRUTURA DAS TABELAS
-- ========================================

-- Tabela brokers
SELECT 
  COUNT(*) as total_brokers,
  COUNT(CASE WHEN is_active = true THEN 1 END) as ativos,
  COUNT(CASE WHEN website_slug IS NOT NULL THEN 1 END) as com_slug,
  COUNT(CASE WHEN subdomain IS NOT NULL THEN 1 END) as com_subdomain
FROM public.brokers;

-- Verificar broker específico (rfimobiliaria)
SELECT 
  id, 
  business_name, 
  website_slug, 
  subdomain,
  custom_domain,
  is_active,
  created_at
FROM public.brokers 
WHERE website_slug = 'rfimobiliaria' 
   OR subdomain = 'rfimobiliaria'
LIMIT 5;

-- ========================================
-- 2. VERIFICAR PERMISSÕES RLS (Row Level Security)
-- ========================================

-- Verificar políticas RLS na tabela brokers
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'brokers';

-- ========================================
-- 3. VERIFICAR TABELAS RELACIONADAS
-- ========================================

-- Properties
SELECT 
  COUNT(*) as total_properties,
  COUNT(CASE WHEN is_active = true THEN 1 END) as ativas
FROM public.properties;

-- Leads
SELECT 
  COUNT(*) as total_leads,
  COUNT(CASE WHEN status = 'new' THEN 1 END) as novos,
  COUNT(CASE WHEN status = 'contacted' THEN 1 END) as contatados
FROM public.leads;

-- Realtors
SELECT 
  COUNT(*) as total_realtors,
  COUNT(CASE WHEN is_active = true THEN 1 END) as ativos
FROM public.realtors;

-- ========================================
-- 4. VERIFICAR INTEGRIDADE REFERENCIAL
-- ========================================

-- Properties sem broker (ERRO se retornar algo)
SELECT 
  p.id, 
  p.title, 
  p.broker_id
FROM public.properties p
LEFT JOIN public.brokers b ON p.broker_id = b.id
WHERE b.id IS NULL
LIMIT 5;

-- Leads sem broker (ERRO se retornar algo)
SELECT 
  l.id, 
  l.name, 
  l.broker_id
FROM public.leads l
LEFT JOIN public.brokers b ON l.broker_id = b.id
WHERE b.id IS NULL
LIMIT 5;

-- ========================================
-- 5. TESTAR QUERIES TÍPICAS DO FRONTEND
-- ========================================

-- Buscar broker por subdomain (simulando identifyByDomain)
SELECT 
  id,
  business_name,
  website_slug,
  subdomain,
  custom_domain,
  is_active
FROM public.brokers 
WHERE (subdomain = 'rfimobiliaria' OR website_slug = 'rfimobiliaria')
  AND is_active = true
LIMIT 1;

-- Buscar properties de um broker
SELECT 
  id,
  title,
  property_type,
  transaction_type,
  price,
  is_active
FROM public.properties
WHERE broker_id = (
  SELECT id FROM public.brokers WHERE website_slug = 'rfimobiliaria' LIMIT 1
)
AND is_active = true
LIMIT 5;

-- ========================================
-- 6. VERIFICAR ÍNDICES (Performance)
-- ========================================

SELECT 
  tablename, 
  indexname, 
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('brokers', 'properties', 'leads', 'realtors')
ORDER BY tablename, indexname;

-- ========================================
-- 7. VERIFICAR FUNÇÕES E TRIGGERS
-- ========================================

SELECT 
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname LIKE '%broker%'
ORDER BY function_name;

-- ========================================
-- RESUMO DE SAÚDE
-- ========================================

SELECT 
  'BROKERS' as tabela,
  COUNT(*) as total,
  COUNT(CASE WHEN is_active THEN 1 END) as ativos,
  MAX(created_at) as ultimo_criado
FROM public.brokers
UNION ALL
SELECT 
  'PROPERTIES',
  COUNT(*),
  COUNT(CASE WHEN is_active THEN 1 END),
  MAX(created_at)
FROM public.properties
UNION ALL
SELECT 
  'LEADS',
  COUNT(*),
  COUNT(CASE WHEN status = 'new' THEN 1 END),
  MAX(created_at)
FROM public.leads
UNION ALL
SELECT 
  'REALTORS',
  COUNT(*),
  COUNT(CASE WHEN is_active THEN 1 END),
  MAX(created_at)
FROM public.realtors;
