-- Script para verificar configuração de domínio personalizado no Supabase
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se o domínio está configurado na tabela brokers
SELECT 
  id,
  business_name,
  website_slug,
  custom_domain,
  is_active,
  created_at
FROM brokers 
WHERE custom_domain IS NOT NULL 
   OR custom_domain = 'maisexpansaodeconsciencia.site'
   OR business_name ILIKE '%expansao%'
   OR business_name ILIKE '%rf%'
ORDER BY created_at DESC;

-- 2. Verificar se existe a tabela domain_verifications
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'domain_verifications'
) AS domain_verifications_exists;

-- 3. Verificar estrutura da tabela domain_verifications
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'domain_verifications'
ORDER BY ordinal_position;

-- 3b. Se existir, verificar registros (ajustado conforme estrutura real)
SELECT 
  dv.id,
  dv.broker_id,
  dv.domain,
  dv.is_valid,
  dv.created_at,
  dv.updated_at,
  b.business_name
FROM domain_verifications dv
LEFT JOIN brokers b ON b.id = dv.broker_id
ORDER BY dv.created_at DESC
LIMIT 10;

-- 4. Verificar estrutura da tabela brokers (colunas relevantes)
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'brokers' 
  AND column_name IN ('custom_domain', 'website_slug', 'subdomain', 'business_name')
ORDER BY ordinal_position;

-- 5. Contar brokers com domínio personalizado
SELECT 
  COUNT(*) FILTER (WHERE custom_domain IS NOT NULL) as with_custom_domain,
  COUNT(*) FILTER (WHERE website_slug IS NOT NULL) as with_slug,
  COUNT(*) as total_brokers
FROM brokers;

