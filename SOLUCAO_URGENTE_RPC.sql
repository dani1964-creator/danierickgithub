-- ====================================================================
-- SOLUÇÃO URGENTE: CORRIGIR RPC E POLÍTICAS RLS
-- ====================================================================
-- Execute este script NO SUPABASE SQL EDITOR
-- Data: 2025-11-21
-- ====================================================================

-- ====================================================================
-- PASSO 1: REMOVER RPC ANTIGA COM ORDEM DE PARÂMETROS ERRADA
-- ====================================================================

DROP FUNCTION IF EXISTS get_property_by_slug(text, text, text);

-- ====================================================================
-- PASSO 2: CRIAR RPC COM ORDEM CORRETA DE PARÂMETROS
-- ====================================================================

CREATE OR REPLACE FUNCTION get_property_by_slug(
  p_property_slug text,    -- 1º: SLUG DO IMÓVEL (corrigido!)
  p_broker_slug text,      -- 2º: SLUG DO BROKER
  p_custom_domain text     -- 3º: DOMÍNIO CUSTOMIZADO
)
RETURNS TABLE(
  id uuid,
  title text,
  description text,
  price numeric,
  property_type text,
  bedrooms integer,
  bathrooms integer,
  area_m2 numeric,
  built_year integer,
  parking_spaces integer,
  address text,
  neighborhood text,
  city text,
  uf text,
  main_image_url text,
  images text[],
  slug text,
  status text,
  is_featured boolean,
  views_count integer,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  broker_id uuid,
  show_views_count boolean,
  show_neighborhood boolean,
  amenities text[],
  nearby_locations text[],
  broker_business_name text,
  broker_website_slug text,
  broker_logo_url text,
  broker_custom_domain text
)
LANGUAGE plpgsql
AS $$
DECLARE
  target_broker_id uuid;
BEGIN
  -- Encontrar broker por domínio customizado OU slug
  IF p_custom_domain IS NOT NULL THEN
    SELECT b.id INTO target_broker_id 
    FROM brokers b 
    WHERE b.custom_domain = p_custom_domain 
      AND b.is_active = true;
  ELSIF p_broker_slug IS NOT NULL THEN
    SELECT b.id INTO target_broker_id 
    FROM brokers b 
    WHERE b.website_slug = p_broker_slug 
      AND b.is_active = true;
  END IF;

  -- Se não encontrou broker, retornar vazio
  IF target_broker_id IS NULL THEN
    RETURN;
  END IF;

  -- Retornar propriedade com VALIDAÇÕES e COALESCE
  RETURN QUERY
  SELECT 
    p.id,
    COALESCE(p.title, 'Imóvel sem título') as title,
    p.description,
    COALESCE(p.price, 0) as price,
    COALESCE(p.property_type, 'apartment') as property_type,
    p.bedrooms,
    p.bathrooms,
    p.area_m2,
    p.built_year,
    p.parking_spaces,
    p.address,
    p.neighborhood,
    p.city,
    p.uf,
    p.main_image_url,
    p.images,
    COALESCE(p.slug, '') as slug,
    COALESCE(p.status, 'active') as status,
    COALESCE(p.is_featured, false) as is_featured,
    COALESCE(p.views_count, 0) as views_count,
    p.created_at,
    p.updated_at,
    p.broker_id,
    COALESCE(p.show_views_count, true) as show_views_count,
    COALESCE(p.show_neighborhood, true) as show_neighborhood,
    NULL::text[] as amenities,
    NULL::text[] as nearby_locations,
    b.business_name as broker_business_name,
    b.website_slug as broker_website_slug,
    b.logo_url as broker_logo_url,
    b.custom_domain as broker_custom_domain
  FROM properties p
  JOIN brokers b ON p.broker_id = b.id
  WHERE p.broker_id = target_broker_id 
    AND p.slug = p_property_slug 
    AND COALESCE(p.is_active, true) = true
    AND COALESCE(b.is_active, true) = true;
END;
$$;

-- ====================================================================
-- PASSO 3: GARANTIR PERMISSÕES PARA ACESSO PÚBLICO
-- ====================================================================

GRANT EXECUTE ON FUNCTION get_property_by_slug(text, text, text) TO anon;
GRANT EXECUTE ON FUNCTION get_property_by_slug(text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_property_by_slug(text, text, text) TO service_role;

-- ====================================================================
-- PASSO 4: REMOVER POLÍTICA RLS PROBLEMÁTICA
-- ====================================================================

DROP POLICY IF EXISTS "public_read_published_properties" ON properties;

-- ====================================================================
-- PASSO 5: CRIAR POLÍTICA RLS CORRIGIDA
-- ====================================================================

CREATE POLICY "public_read_published_properties_fixed"
ON properties
FOR SELECT
TO anon
USING (
  (is_published = true) 
  AND (status = 'active'::text) 
  AND (EXISTS (
    SELECT 1
    FROM brokers b
    WHERE b.id = properties.broker_id 
      AND b.is_active = true  -- ✅ CORRIGIDO: usa is_active em vez de status
  ))
);

-- ====================================================================
-- PASSO 6: ADICIONAR WEBSITE_SLUG AOS BROKERS SEM SLUG
-- ====================================================================

-- Atualizar brokers sem website_slug (gerar slug automaticamente)
UPDATE brokers
SET website_slug = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      business_name, 
      '[^a-zA-Z0-9\s-]', '', 'g'
    ),
    '\s+', '-', 'g'
  )
) || '-' || SUBSTRING(id::text, 1, 8)
WHERE website_slug IS NULL;

-- ====================================================================
-- PASSO 7: VERIFICAÇÃO FINAL
-- ====================================================================

-- 7.1 Verificar se a RPC foi criada com ordem correta
SELECT 
  proname as function_name,
  pg_get_function_arguments(oid) as arguments
FROM pg_proc
WHERE proname = 'get_property_by_slug'
  AND pronamespace = 'public'::regnamespace;

-- 7.2 Verificar se brokers têm slugs
SELECT 
  id,
  business_name,
  website_slug,
  CASE 
    WHEN website_slug IS NULL THEN '❌ SEM SLUG'
    ELSE '✅ OK'
  END as status
FROM brokers
WHERE is_active = true;

-- 7.3 Testar a RPC com dados reais
-- SUBSTITUA pelos slugs reais da sua base
SELECT * FROM get_property_by_slug(
  'casa-teste-venda',  -- p_property_slug (1º parâmetro)
  'rfimobiliaria',     -- p_broker_slug (2º parâmetro)
  NULL                 -- p_custom_domain (3º parâmetro)
);

-- ✅ SE RETORNAR 1 LINHA COM DADOS, ESTÁ FUNCIONANDO!

-- 7.4 Testar com domínio customizado
SELECT * FROM get_property_by_slug(
  'casa-teste-venda',  -- p_property_slug
  NULL,                -- p_broker_slug
  'imobideps.com'      -- p_custom_domain
);

-- ====================================================================
-- FIM DO SCRIPT
-- ====================================================================

-- 🎯 PRÓXIMOS PASSOS:
-- 1. Execute este script completo no Supabase SQL Editor
-- 2. Teste o site público no navegador
-- 3. Recarregue a página de detalhes 5-10 vezes
-- 4. Se aparecer CONSISTENTEMENTE = problema resolvido! ✅
