-- =====================================================
-- SOLUÇÃO DEFINITIVA: FUNÇÃO RPC FUNCIONANDO
-- Execute este SQL no Dashboard do Supabase
-- =====================================================

-- 1. REMOVER COMPLETAMENTE A FUNÇÃO QUEBRADA
DROP FUNCTION IF EXISTS get_homepage_categories_with_properties CASCADE;

-- 2. CRIAR FUNÇÃO NOVA COM ESTRUTURA SIMPLES E FUNCIONAL
CREATE OR REPLACE FUNCTION get_homepage_categories_with_properties(
  p_broker_id UUID,
  p_properties_per_category INTEGER DEFAULT 12
)
RETURNS TABLE (
  category_id UUID,
  category_name TEXT,
  category_slug TEXT,
  category_description TEXT,
  category_color TEXT,
  category_icon TEXT,
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
    pc.color as category_color,
    pc.icon as category_icon,
    pc.display_order as category_display_order,
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

-- 3. CONFIGURAR PERMISSÕES
GRANT EXECUTE ON FUNCTION get_homepage_categories_with_properties(UUID, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION get_homepage_categories_with_properties(UUID, INTEGER) TO authenticated;

-- 4. TESTE RÁPIDO (opcional - apenas para verificar se funciona)
-- SELECT get_homepage_categories_with_properties('1e7b21c7-1727-4741-8b89-dcddc406ce06', 3);