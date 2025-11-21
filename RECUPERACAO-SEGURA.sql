
-- FUNÇÃO SEGURA DE RECUPERAÇÃO
CREATE OR REPLACE FUNCTION get_homepage_categories_with_properties(
  p_broker_id UUID,
  p_properties_per_category INTEGER DEFAULT 12
)
RETURNS TABLE (
  category_id UUID,
  category_name TEXT,
  category_slug TEXT,
  category_description TEXT,
  properties_count BIGINT,
  properties JSONB
)
SECURITY DEFINER  
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  category_record RECORD;
  property_record RECORD;
  category_result RECORD;
BEGIN
  -- Loop através das categorias
  FOR category_record IN 
    SELECT id, name, slug, description
    FROM property_categories 
    WHERE broker_id = p_broker_id 
      AND is_active = true 
      AND show_on_homepage = true
    ORDER BY name
  LOOP
    -- Contar imóveis para esta categoria
    SELECT COUNT(DISTINCT pca.property_id) INTO category_result.prop_count
    FROM property_category_assignments pca
    INNER JOIN properties p ON pca.property_id = p.id
    WHERE pca.category_id = category_record.id 
      AND pca.broker_id = p_broker_id
      AND p.is_active = true 
      AND p.is_published = true;
    
    -- Buscar imóveis para esta categoria
    SELECT jsonb_agg(
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
        'images', p.images
      ) ORDER BY p.created_at DESC
    ) INTO category_result.prop_json
    FROM property_category_assignments pca
    INNER JOIN properties p ON pca.property_id = p.id
    WHERE pca.category_id = category_record.id 
      AND pca.broker_id = p_broker_id
      AND p.is_active = true 
      AND p.is_published = true
    LIMIT p_properties_per_category;
    
    -- Retornar linha para esta categoria
    RETURN QUERY SELECT 
      category_record.id,
      category_record.name,
      category_record.slug,
      category_record.description,
      COALESCE(category_result.prop_count, 0)::BIGINT,
      COALESCE(category_result.prop_json, '[]'::jsonb);
  END LOOP;
  
  RETURN;
END;
$$;

-- Permissões
GRANT EXECUTE ON FUNCTION get_homepage_categories_with_properties(UUID, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION get_homepage_categories_with_properties(UUID, INTEGER) TO authenticated;
