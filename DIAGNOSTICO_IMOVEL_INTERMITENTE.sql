-- ====================================================================
-- DIAGNÓSTICO COMPLETO: PROBLEMA DE IMÓVEIS APARECENDO E SUMINDO
-- ====================================================================
-- Executeq estas queries no SQL Editor do Supabase Dashboard
-- Data: 2025-11-21
-- ====================================================================

-- ====================================================================
-- PARTE 1: VERIFICAÇÃO DA ESTRUTURA DA TABELA PROPERTIES
-- ====================================================================

-- 1.1 Verificar todas as colunas da tabela properties
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'properties'
ORDER BY ordinal_position;

-- 1.2 Verificar constraints e indexes
SELECT
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.properties'::regclass;

-- 1.3 Verificar indexes
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public' 
  AND tablename = 'properties';

-- ====================================================================
-- PARTE 2: AUDITORIA DE DADOS - CAMPOS CRÍTICOS
-- ====================================================================

-- 2.1 CRÍTICO: Verificar campos NULL ou vazios que impedem exibição
SELECT 
    'properties com property_type NULL' as issue,
    COUNT(*) as total,
    ARRAY_AGG(id) FILTER (WHERE property_type IS NULL) as affected_ids
FROM properties
WHERE property_type IS NULL
UNION ALL
SELECT 
    'properties com slug NULL' as issue,
    COUNT(*) as total,
    ARRAY_AGG(id) FILTER (WHERE slug IS NULL) as affected_ids
FROM properties
WHERE slug IS NULL
UNION ALL
SELECT 
    'properties com is_active NULL' as issue,
    COUNT(*) as total,
    ARRAY_AGG(id) FILTER (WHERE is_active IS NULL) as affected_ids
FROM properties
WHERE is_active IS NULL
UNION ALL
SELECT 
    'properties com is_published NULL' as issue,
    COUNT(*) as total,
    ARRAY_AGG(id) FILTER (WHERE is_published IS NULL) as affected_ids
FROM properties
WHERE is_published IS NULL;

-- 2.2 Verificar registros com múltiplos problemas
SELECT 
    p.id,
    p.title,
    p.slug,
    p.property_type,
    p.is_active,
    p.is_published,
    p.broker_id,
    b.website_slug as broker_slug,
    b.custom_domain,
    b.is_active as broker_is_active,
    CASE 
        WHEN p.property_type IS NULL THEN 'SEM property_type'
        WHEN p.slug IS NULL THEN 'SEM slug'
        WHEN p.is_active IS NULL THEN 'is_active NULL'
        WHEN p.is_active = false THEN 'is_active FALSE'
        WHEN p.is_published IS NULL THEN 'is_published NULL'
        WHEN p.is_published = false THEN 'is_published FALSE'
        WHEN b.id IS NULL THEN 'BROKER NÃO EXISTE'
        WHEN b.is_active = false THEN 'BROKER INATIVO'
        ELSE 'OK'
    END as status_diagnosis
FROM properties p
LEFT JOIN brokers b ON p.broker_id = b.id
WHERE 
    p.property_type IS NULL 
    OR p.slug IS NULL 
    OR p.is_active IS NULL 
    OR p.is_active = false
    OR p.is_published IS NULL
    OR p.is_published = false
    OR b.id IS NULL
    OR b.is_active = false
ORDER BY p.created_at DESC;

-- 2.3 Estatísticas gerais
SELECT 
    COUNT(*) as total_properties,
    COUNT(*) FILTER (WHERE is_active = true) as active_properties,
    COUNT(*) FILTER (WHERE is_active = false) as inactive_properties,
    COUNT(*) FILTER (WHERE is_active IS NULL) as null_is_active,
    COUNT(*) FILTER (WHERE is_published = true) as published_properties,
    COUNT(*) FILTER (WHERE is_published = false) as unpublished_properties,
    COUNT(*) FILTER (WHERE is_published IS NULL) as null_is_published,
    COUNT(*) FILTER (WHERE property_type IS NULL) as null_property_type,
    COUNT(*) FILTER (WHERE slug IS NULL) as null_slug,
    COUNT(*) FILTER (WHERE is_active = true AND is_published = true) as visible_properties
FROM properties;

-- ====================================================================
-- PARTE 3: VERIFICAÇÃO DA RPC get_property_by_slug
-- ====================================================================

-- 3.1 Listar todas as versões da função get_property_by_slug
SELECT 
    n.nspname as schema,
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'get_property_by_slug'
  AND n.nspname = 'public';

-- 3.2 Verificar permissões da RPC
SELECT 
    grantee, 
    privilege_type
FROM information_schema.routine_privileges
WHERE routine_schema = 'public' 
  AND routine_name = 'get_property_by_slug';

-- ====================================================================
-- PARTE 4: TESTE DA RPC COM DADOS REAIS
-- ====================================================================

-- 4.1 Listar imóveis disponíveis para teste (pegue alguns slugs daqui)
SELECT 
    p.id,
    p.slug as property_slug,
    p.title,
    p.property_type,
    p.is_active,
    p.is_published,
    b.website_slug as broker_slug,
    b.custom_domain,
    b.business_name
FROM properties p
JOIN brokers b ON p.broker_id = b.id
WHERE p.is_active = true 
  AND p.slug IS NOT NULL
ORDER BY p.created_at DESC
LIMIT 10;

-- 4.2 Testar a RPC com um imóvel específico
-- SUBSTITUA 'seu-imovel-slug' e 'seu-broker-slug' pelos valores reais da query acima
SELECT * FROM get_property_by_slug(
    'seu-imovel-slug'::TEXT,     -- p_property_slug
    'seu-broker-slug'::TEXT,     -- p_broker_slug
    NULL                          -- p_custom_domain
);

-- 4.3 Testar RPC com domínio customizado (se aplicável)
-- SUBSTITUA pelos valores reais
SELECT * FROM get_property_by_slug(
    'seu-imovel-slug'::TEXT,     -- p_property_slug
    NULL,                         -- p_broker_slug
    'seu-dominio.com.br'::TEXT   -- p_custom_domain
);

-- ====================================================================
-- PARTE 5: VERIFICAÇÃO DE POLÍTICAS RLS (Row Level Security)
-- ====================================================================

-- 5.1 Verificar se RLS está habilitado
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'properties';

-- 5.2 Listar todas as políticas RLS da tabela properties
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as command,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'properties';

-- 5.3 Verificar políticas que afetam acesso público (anon)
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'properties'
  AND 'anon' = ANY(roles);

-- ====================================================================
-- PARTE 6: VERIFICAÇÃO DE BROKERS
-- ====================================================================

-- 6.1 Verificar brokers com problemas
SELECT 
    id,
    business_name,
    website_slug,
    custom_domain,
    is_active,
    CASE 
        WHEN website_slug IS NULL AND custom_domain IS NULL THEN 'SEM SLUG E SEM DOMÍNIO'
        WHEN website_slug IS NULL THEN 'SEM SLUG'
        WHEN custom_domain IS NULL THEN 'SEM DOMÍNIO CUSTOMIZADO'
        WHEN is_active = false THEN 'INATIVO'
        ELSE 'OK'
    END as broker_status
FROM brokers
WHERE website_slug IS NULL 
   OR is_active = false
   OR custom_domain IS NULL;

-- 6.2 Verificar imóveis órfãos (sem broker)
SELECT 
    p.id,
    p.title,
    p.slug,
    p.broker_id,
    'BROKER NÃO EXISTE' as issue
FROM properties p
LEFT JOIN brokers b ON p.broker_id = b.id
WHERE b.id IS NULL;

-- ====================================================================
-- PARTE 7: VERIFICAÇÃO DE DUPLICATAS E CONFLITOS
-- ====================================================================

-- 7.1 Verificar slugs duplicados de imóveis
SELECT 
    slug,
    COUNT(*) as duplicates,
    ARRAY_AGG(id) as property_ids,
    ARRAY_AGG(broker_id) as broker_ids
FROM properties
WHERE slug IS NOT NULL
GROUP BY slug
HAVING COUNT(*) > 1;

-- 7.2 Verificar slugs de broker duplicados
SELECT 
    website_slug,
    COUNT(*) as duplicates,
    ARRAY_AGG(id) as broker_ids
FROM brokers
WHERE website_slug IS NOT NULL
GROUP BY website_slug
HAVING COUNT(*) > 1;

-- 7.3 Verificar domínios customizados duplicados
SELECT 
    custom_domain,
    COUNT(*) as duplicates,
    ARRAY_AGG(id) as broker_ids
FROM brokers
WHERE custom_domain IS NOT NULL
GROUP BY custom_domain
HAVING COUNT(*) > 1;

-- ====================================================================
-- PARTE 8: ANÁLISE DE TIMESTAMPS (Detectar mudanças recentes)
-- ====================================================================

-- 8.1 Imóveis criados ou modificados nas últimas 24 horas
SELECT 
    id,
    title,
    slug,
    is_active,
    is_published,
    created_at,
    updated_at,
    CASE 
        WHEN updated_at > NOW() - INTERVAL '1 hour' THEN 'MODIFICADO NA ÚLTIMA HORA'
        WHEN updated_at > NOW() - INTERVAL '24 hours' THEN 'MODIFICADO HOJE'
        ELSE 'ANTIGO'
    END as recency
FROM properties
WHERE updated_at > NOW() - INTERVAL '24 hours'
   OR created_at > NOW() - INTERVAL '24 hours'
ORDER BY updated_at DESC;

-- 8.2 Brokers modificados recentemente
SELECT 
    id,
    business_name,
    website_slug,
    custom_domain,
    is_active,
    updated_at
FROM brokers
WHERE updated_at > NOW() - INTERVAL '24 hours'
ORDER BY updated_at DESC;

-- ====================================================================
-- PARTE 9: VERIFICAÇÃO DE IMAGES E CAMPOS JSONB
-- ====================================================================

-- 9.1 Verificar imóveis sem imagens
SELECT 
    COUNT(*) FILTER (WHERE images IS NULL) as sem_images_null,
    COUNT(*) FILTER (WHERE images = '[]'::jsonb) as sem_images_vazio,
    COUNT(*) FILTER (WHERE main_image_url IS NULL) as sem_main_image,
    COUNT(*) FILTER (WHERE images IS NOT NULL AND jsonb_array_length(images) > 0) as com_images
FROM properties;

-- 9.2 Verificar estrutura do campo images
SELECT 
    id,
    title,
    slug,
    jsonb_typeof(images) as images_type,
    CASE 
        WHEN images IS NULL THEN 0
        WHEN jsonb_typeof(images) = 'array' THEN jsonb_array_length(images)
        ELSE -1
    END as images_count,
    main_image_url
FROM properties
WHERE is_active = true
LIMIT 10;

-- ====================================================================
-- PARTE 10: SUMMARY - PROBLEMAS CRÍTICOS ENCONTRADOS
-- ====================================================================

SELECT 
    'RESUMO DOS PROBLEMAS' as categoria,
    '' as detalhe,
    0 as quantidade
WHERE false
UNION ALL
SELECT 
    '1. CAMPOS NULL CRÍTICOS' as categoria,
    'property_type NULL' as detalhe,
    COUNT(*) as quantidade
FROM properties WHERE property_type IS NULL
UNION ALL
SELECT 
    '1. CAMPOS NULL CRÍTICOS' as categoria,
    'slug NULL' as detalhe,
    COUNT(*) as quantidade
FROM properties WHERE slug IS NULL
UNION ALL
SELECT 
    '2. CAMPOS DE PUBLICAÇÃO' as categoria,
    'is_active = false' as detalhe,
    COUNT(*) as quantidade
FROM properties WHERE is_active = false
UNION ALL
SELECT 
    '2. CAMPOS DE PUBLICAÇÃO' as categoria,
    'is_published = false' as detalhe,
    COUNT(*) as quantidade
FROM properties WHERE is_published = false OR is_published IS NULL
UNION ALL
SELECT 
    '3. PROBLEMAS COM BROKERS' as categoria,
    'Brokers inativos' as detalhe,
    COUNT(*) as quantidade
FROM brokers WHERE is_active = false
UNION ALL
SELECT 
    '3. PROBLEMAS COM BROKERS' as categoria,
    'Imóveis com broker inativo' as detalhe,
    COUNT(p.id) as quantidade
FROM properties p
JOIN brokers b ON p.broker_id = b.id
WHERE b.is_active = false
UNION ALL
SELECT 
    '4. SLUGS DUPLICADOS' as categoria,
    'Properties com slug duplicado' as detalhe,
    COUNT(DISTINCT slug) as quantidade
FROM (
    SELECT slug, COUNT(*) as cnt
    FROM properties
    WHERE slug IS NOT NULL
    GROUP BY slug
    HAVING COUNT(*) > 1
) dup
UNION ALL
SELECT 
    '5. TOTAL DE IMÓVEIS' as categoria,
    'Total geral' as detalhe,
    COUNT(*) as quantidade
FROM properties
UNION ALL
SELECT 
    '5. TOTAL DE IMÓVEIS' as categoria,
    'Visíveis (active + published)' as detalhe,
    COUNT(*) as quantidade
FROM properties
WHERE is_active = true AND (is_published = true OR is_published IS NULL)
ORDER BY categoria, detalhe;
