-- =====================================================
-- CORREÇÃO COMPLETA: RPC + DETALHES + CATEGORIAS
-- Execute este SQL no Dashboard do Supabase
-- =====================================================

-- 1. REMOVER FUNÇÃO QUEBRADA COMPLETAMENTE
DROP FUNCTION IF EXISTS get_homepage_categories_with_properties CASCADE;

-- 2. RECRIAR FUNÇÃO COM ESTRUTURA CORRETA
CREATE OR REPLACE FUNCTION get_homepage_categories_with_properties(
  p_broker_id UUID,
  p_properties_per_category INTEGER DEFAULT 12
)
RETURNS TABLE (
  category_id UUID,
  category_name VARCHAR(100),
  category_slug VARCHAR(100),
  category_description TEXT,
  category_color VARCHAR(7),
  category_icon VARCHAR(50),
  category_display_order INTEGER,
  properties_count BIGINT,
  properties JSONB
)
SECURITY DEFINER  
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pc.id as category_id,
    pc.name as category_name,
    pc.slug as category_slug,
    pc.description as category_description,
    COALESCE(pc.color, '#2563eb') as category_color,
    COALESCE(pc.icon, 'Star') as category_icon,
    COALESCE(pc.display_order, 999) as category_display_order,
    COUNT(DISTINCT pca.property_id) as properties_count,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', p.id,
          'title', p.title,
          'slug', p.slug,
          'price', p.price,
          'location', COALESCE(p.address, p.neighborhood || ', ' || p.city),
          'property_type', p.property_type,
          'transaction_type', p.transaction_type,
          'bedrooms', p.bedrooms,
          'bathrooms', p.bathrooms,
          'area', p.area_m2,
          'is_featured', p.is_featured,
          'created_at', p.created_at,
          'images', p.images,
          'main_image_url', p.main_image_url
        ) ORDER BY p.created_at DESC
      ) FILTER (WHERE p.id IS NOT NULL),
      '[]'::jsonb
    ) as properties
  FROM property_categories pc
  LEFT JOIN property_category_assignments pca ON pc.id = pca.category_id
  LEFT JOIN properties p ON pca.property_id = p.id 
    AND p.is_active = true 
    AND p.is_published = true
    AND p.broker_id = p_broker_id
  WHERE pc.broker_id = p_broker_id
    AND pc.is_active = true
    AND pc.show_on_homepage = true
  GROUP BY pc.id, pc.name, pc.slug, pc.description, pc.color, pc.icon, pc.display_order
  ORDER BY 
    CASE WHEN pc.display_order IS NULL THEN 999999 ELSE pc.display_order END ASC,
    pc.name ASC;
END;
$$;

-- 3. PERMISSÕES
GRANT EXECUTE ON FUNCTION get_homepage_categories_with_properties(UUID, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION get_homepage_categories_with_properties(UUID, INTEGER) TO authenticated;

-- 4. CRIAR FUNÇÃO PARA BUSCAR PROPRIEDADE POR SLUG (para páginas de detalhes)
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
BEGIN
  RETURN QUERY
  SELECT 
    p.id as property_id,
    jsonb_build_object(
      'id', p.id,
      'title', p.title,
      'description', p.description,
      'price', p.price,
      'property_type', p.property_type,
      'transaction_type', p.transaction_type,
      'address', p.address,
      'neighborhood', p.neighborhood,
      'city', p.city,
      'uf', p.uf,
      'bedrooms', p.bedrooms,
      'bathrooms', p.bathrooms,
      'area_m2', p.area_m2,
      'parking_spaces', p.parking_spaces,
      'is_featured', p.is_featured,
      'views_count', p.views_count,
      'slug', p.slug,
      'images', p.images,
      'main_image_url', p.main_image_url,
      'features', p.features,
      'created_at', p.created_at
    ) as property_data,
    jsonb_build_object(
      'id', b.id,
      'business_name', b.business_name,
      'display_name', b.display_name,
      'website_slug', b.website_slug,
      'custom_domain', b.custom_domain,
      'phone', b.phone,
      'whatsapp_number', b.whatsapp_number,
      'email', b.email,
      'logo_url', b.logo_url
    ) as broker_data
  FROM properties p
  INNER JOIN brokers b ON p.broker_id = b.id
  WHERE p.slug = p_property_slug
    AND p.is_active = true 
    AND p.is_published = true
    AND (
      (p_broker_slug IS NOT NULL AND b.website_slug = p_broker_slug) OR
      (p_custom_domain IS NOT NULL AND b.custom_domain = p_custom_domain)
    );
END;
$$;

-- 5. PERMISSÕES PARA NOVA FUNÇÃO
GRANT EXECUTE ON FUNCTION get_property_by_slug(TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_property_by_slug(TEXT, TEXT, TEXT) TO authenticated;

-- 6. INCREMENTAR VIEWS DE PROPRIEDADE (função auxiliar)
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