-- ====================================================================
-- SCRIPT DE CORREÇÃO: PROBLEMA DE IMÓVEIS APARECENDO E SUMINDO
-- ====================================================================
-- Execute estas queries APÓS executar o diagnóstico
-- Execute em ordem e verifique os resultados antes de continuar
-- ====================================================================

-- ====================================================================
-- PASSO 1: GARANTIR QUE A COLUNA is_published EXISTE
-- ====================================================================

-- 1.1 Adicionar coluna is_published se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'properties' 
        AND column_name = 'is_published'
    ) THEN
        ALTER TABLE properties ADD COLUMN is_published BOOLEAN DEFAULT true;
        RAISE NOTICE 'Coluna is_published adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna is_published já existe';
    END IF;
END $$;

-- 1.2 Garantir que a coluna slug existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'properties' 
        AND column_name = 'slug'
    ) THEN
        ALTER TABLE properties ADD COLUMN slug TEXT;
        RAISE NOTICE 'Coluna slug adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna slug já existe';
    END IF;
END $$;

-- ====================================================================
-- PASSO 2: CORRIGIR VALORES NULL EM CAMPOS CRÍTICOS
-- ====================================================================

-- 2.1 Corrigir property_type NULL (definir valor padrão)
UPDATE properties
SET property_type = 'apartment'
WHERE property_type IS NULL;

-- Verificar resultado
SELECT 
    'property_type corrigido' as acao,
    COUNT(*) as registros_afetados
FROM properties
WHERE property_type = 'apartment';

-- 2.2 Corrigir is_active NULL
UPDATE properties
SET is_active = true
WHERE is_active IS NULL;

-- 2.3 Corrigir is_published NULL
UPDATE properties
SET is_published = true
WHERE is_published IS NULL;

-- 2.4 Gerar slugs faltantes
UPDATE properties
SET slug = LOWER(
    REGEXP_REPLACE(
        REGEXP_REPLACE(
            UNACCENT(title), 
            '[^a-zA-Z0-9\s-]', '', 'g'
        ),
        '\s+', '-', 'g'
    )
) || '-' || SUBSTRING(id::text, 1, 8)
WHERE slug IS NULL;

-- Verificar resultado da correção de slugs
SELECT 
    'Slugs corrigidos' as acao,
    COUNT(*) FILTER (WHERE slug IS NOT NULL) as com_slug,
    COUNT(*) FILTER (WHERE slug IS NULL) as sem_slug
FROM properties;

-- ====================================================================
-- PASSO 3: CRIAR OU SUBSTITUIR A RPC get_property_by_slug CORRIGIDA
-- ====================================================================

-- 3.1 Remover versões antigas da função
DROP FUNCTION IF EXISTS get_property_by_slug(TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS get_property_by_slug(TEXT, TEXT);
DROP FUNCTION IF EXISTS get_property_by_slug(TEXT);

-- 3.2 Criar nova versão robusta da RPC
CREATE OR REPLACE FUNCTION get_property_by_slug(
  p_property_slug TEXT,
  p_broker_slug TEXT DEFAULT NULL,
  p_custom_domain TEXT DEFAULT NULL
)
RETURNS TABLE (
  property_id UUID,
  property_data JSONB,
  broker_data JSONB
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_broker_id UUID;
BEGIN
  -- Validar parâmetros de entrada
  IF p_property_slug IS NULL OR p_property_slug = '' THEN
    RAISE EXCEPTION 'Property slug não pode ser nulo ou vazio';
  END IF;

  -- Encontrar o broker primeiro
  IF p_custom_domain IS NOT NULL AND p_custom_domain != '' THEN
    -- Buscar por domínio customizado
    SELECT id INTO v_broker_id
    FROM brokers
    WHERE custom_domain = p_custom_domain
      AND is_active = true
    LIMIT 1;
  ELSIF p_broker_slug IS NOT NULL AND p_broker_slug != '' THEN
    -- Buscar por slug do broker
    SELECT id INTO v_broker_id
    FROM brokers
    WHERE website_slug = p_broker_slug
      AND is_active = true
    LIMIT 1;
  END IF;

  -- Se não encontrou broker, retornar vazio
  IF v_broker_id IS NULL THEN
    RAISE NOTICE 'Broker não encontrado: slug=%, domain=%', p_broker_slug, p_custom_domain;
    RETURN;
  END IF;

  -- Retornar propriedade com validações
  RETURN QUERY
  SELECT 
    p.id as property_id,
    jsonb_build_object(
      'id', p.id,
      'title', COALESCE(p.title, 'Título não informado'),
      'description', COALESCE(p.description, ''),
      'price', COALESCE(p.price, 0),
      'property_type', COALESCE(p.property_type, 'apartment'),
      'transaction_type', COALESCE(p.transaction_type, 'sale'),
      'address', COALESCE(p.address, ''),
      'neighborhood', COALESCE(p.neighborhood, ''),
      'city', COALESCE(p.city, ''),
      'uf', COALESCE(p.uf, ''),
      'bedrooms', COALESCE(p.bedrooms, 0),
      'bathrooms', COALESCE(p.bathrooms, 0),
      'area_m2', COALESCE(p.area_m2, 0),
      'parking_spaces', COALESCE(p.parking_spaces, 0),
      'is_featured', COALESCE(p.is_featured, false),
      'is_active', COALESCE(p.is_active, true),
      'is_published', COALESCE(p.is_published, true),
      'views_count', COALESCE(p.views_count, 0),
      'slug', COALESCE(p.slug, ''),
      'images', COALESCE(p.images, '[]'::jsonb),
      'main_image_url', p.main_image_url,
      'features', COALESCE(p.features, ARRAY[]::text[]),
      'created_at', p.created_at,
      'updated_at', p.updated_at
    ) as property_data,
    jsonb_build_object(
      'id', b.id,
      'business_name', COALESCE(b.business_name, ''),
      'display_name', COALESCE(b.display_name, b.business_name, ''),
      'website_slug', COALESCE(b.website_slug, ''),
      'custom_domain', b.custom_domain,
      'phone', b.phone,
      'whatsapp_number', b.whatsapp_number,
      'email', b.email,
      'logo_url', b.logo_url,
      'is_active', COALESCE(b.is_active, true)
    ) as broker_data
  FROM properties p
  INNER JOIN brokers b ON p.broker_id = b.id
  WHERE p.slug = p_property_slug
    AND p.broker_id = v_broker_id
    AND COALESCE(p.is_active, true) = true 
    AND COALESCE(p.is_published, true) = true
    AND COALESCE(b.is_active, true) = true
  LIMIT 1;
  
  -- Log se não encontrou
  IF NOT FOUND THEN
    RAISE NOTICE 'Propriedade não encontrada ou inativa: slug=%, broker_id=%', p_property_slug, v_broker_id;
  END IF;
END;
$$;

-- 3.3 Garantir permissões para acesso público
GRANT EXECUTE ON FUNCTION get_property_by_slug(TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_property_by_slug(TEXT, TEXT, TEXT) TO authenticated;

-- Verificar se a função foi criada
SELECT 
    'Função RPC criada' as status,
    proname as nome_funcao,
    pg_get_function_arguments(oid) as argumentos
FROM pg_proc
WHERE proname = 'get_property_by_slug'
  AND pronamespace = 'public'::regnamespace;

-- ====================================================================
-- PASSO 4: GARANTIR POLÍTICAS RLS CORRETAS
-- ====================================================================

-- 4.1 Remover políticas antigas que podem estar bloqueando
DROP POLICY IF EXISTS "Enable read access for all users" ON properties;
DROP POLICY IF EXISTS "Public properties are viewable by everyone" ON properties;
DROP POLICY IF EXISTS "Anyone can view active properties" ON properties;

-- 4.2 Criar política RLS para acesso público via RPC
CREATE POLICY "Allow public access to properties via RPC"
ON properties
FOR SELECT
TO anon, authenticated
USING (
  is_active = true 
  AND COALESCE(is_published, true) = true
);

-- 4.3 Verificar se RLS está ativo
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'properties';

-- Se RLS não estiver ativo, ativar:
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- ====================================================================
-- PASSO 5: CRIAR ÍNDICES PARA MELHORAR PERFORMANCE
-- ====================================================================

-- 5.1 Índice para busca por slug
CREATE INDEX IF NOT EXISTS idx_properties_slug 
ON properties(slug) 
WHERE is_active = true AND COALESCE(is_published, true) = true;

-- 5.2 Índice composto para busca por broker + slug
CREATE INDEX IF NOT EXISTS idx_properties_broker_slug 
ON properties(broker_id, slug) 
WHERE is_active = true AND COALESCE(is_published, true) = true;

-- 5.3 Índice para website_slug do broker
CREATE INDEX IF NOT EXISTS idx_brokers_website_slug 
ON brokers(website_slug) 
WHERE is_active = true;

-- 5.4 Índice para custom_domain do broker
CREATE INDEX IF NOT EXISTS idx_brokers_custom_domain 
ON brokers(custom_domain) 
WHERE is_active = true;

-- ====================================================================
-- PASSO 6: ADICIONAR CONSTRAINTS PARA PREVENIR DADOS INVÁLIDOS
-- ====================================================================

-- 6.1 Garantir que property_type não seja NULL
ALTER TABLE properties 
ALTER COLUMN property_type SET NOT NULL;

-- 6.2 Garantir que property_type não seja NULL (com valor padrão)
ALTER TABLE properties 
ALTER COLUMN property_type SET DEFAULT 'apartment';

-- 6.3 Garantir que is_active tenha valor padrão
ALTER TABLE properties 
ALTER COLUMN is_active SET DEFAULT true;

-- 6.4 Garantir que is_published tenha valor padrão
ALTER TABLE properties 
ALTER COLUMN is_published SET DEFAULT true;

-- ====================================================================
-- PASSO 7: CRIAR FUNÇÃO AUXILIAR PARA INCREMENT DE VIEWS
-- ====================================================================

CREATE OR REPLACE FUNCTION increment_property_views(
  p_property_id UUID
)
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE properties 
  SET views_count = COALESCE(views_count, 0) + 1,
      updated_at = now()
  WHERE id = p_property_id;
END;
$$;

GRANT EXECUTE ON FUNCTION increment_property_views(UUID) TO anon;
GRANT EXECUTE ON FUNCTION increment_property_views(UUID) TO authenticated;

-- ====================================================================
-- PASSO 8: VERIFICAÇÃO FINAL
-- ====================================================================

-- 8.1 Testar a RPC com dados reais
-- Buscar um imóvel para testar (pegue os valores desta query)
SELECT 
    p.slug as property_slug,
    b.website_slug as broker_slug,
    b.custom_domain,
    p.title,
    p.is_active,
    p.is_published
FROM properties p
JOIN brokers b ON p.broker_id = b.id
WHERE p.is_active = true 
  AND p.slug IS NOT NULL
  AND b.is_active = true
ORDER BY p.created_at DESC
LIMIT 5;

-- 8.2 Executar teste da RPC (SUBSTITUA pelos valores da query acima)
-- SELECT * FROM get_property_by_slug(
--     'seu-imovel-slug',
--     'seu-broker-slug',
--     NULL
-- );

-- 8.3 Estatísticas finais
SELECT 
    'APÓS CORREÇÃO' as momento,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE is_active = true) as ativos,
    COUNT(*) FILTER (WHERE is_published = true) as publicados,
    COUNT(*) FILTER (WHERE is_active = true AND is_published = true) as visiveis,
    COUNT(*) FILTER (WHERE property_type IS NOT NULL) as com_tipo,
    COUNT(*) FILTER (WHERE slug IS NOT NULL) as com_slug
FROM properties;

-- ====================================================================
-- PASSO 9: LOG DE AUDITORIA
-- ====================================================================

-- Criar tabela de log se não existir
CREATE TABLE IF NOT EXISTS property_access_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES properties(id),
    property_slug TEXT,
    broker_slug TEXT,
    custom_domain TEXT,
    accessed_at TIMESTAMPTZ DEFAULT NOW(),
    found BOOLEAN,
    error_message TEXT
);

-- Conceder permissões
GRANT INSERT ON property_access_log TO anon;
GRANT INSERT ON property_access_log TO authenticated;

-- ====================================================================
-- FIM DO SCRIPT DE CORREÇÃO
-- ====================================================================

-- PRÓXIMOS PASSOS PARA O FRONTEND:
-- 1. Adicionar try-catch ao chamar a RPC
-- 2. Adicionar fallback para campos undefined (property_type, etc)
-- 3. Adicionar logs no console para debug
-- 4. Implementar retry logic para chamadas que falham
-- 5. Adicionar loading state adequado
