-- ================================================================
-- RPC: get_public_properties_by_broker
-- Retorna propriedades públicas de um broker específico
-- ================================================================
-- INSTRUÇÕES:
-- 1. Abra o Supabase Dashboard
-- 2. Vá em SQL Editor
-- 3. Cole este SQL completo e execute
-- ================================================================

CREATE OR REPLACE FUNCTION public.get_public_properties_by_broker(
  broker_website_slug TEXT,
  limit_count INT DEFAULT 50,
  offset_count INT DEFAULT 0
)
RETURNS TABLE(
  id UUID,
  title TEXT,
  slug TEXT,
  description TEXT,
  price NUMERIC,
  property_type TEXT,
  transaction_type TEXT,
  area_size NUMERIC,
  bedrooms INT,
  bathrooms INT,
  parking_spaces INT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  neighborhood TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  main_image_url TEXT,
  images JSONB,
  amenities JSONB,
  video_url TEXT,
  virtual_tour_url TEXT,
  is_active BOOLEAN,
  is_featured BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.slug,
    p.description,
    p.price,
    p.property_type,
    p.transaction_type,
    p.area_size,
    p.bedrooms,
    p.bathrooms,
    p.parking_spaces,
    p.address,
    p.city,
    p.state,
    p.zip_code,
    p.neighborhood,
    p.latitude,
    p.longitude,
    p.main_image_url,
    p.images,
    p.amenities,
    p.video_url,
    p.virtual_tour_url,
    p.is_active,
    p.is_featured,
    p.created_at,
    p.updated_at
  FROM properties p
  INNER JOIN brokers b ON p.broker_id = b.id
  WHERE 
    b.website_slug = broker_website_slug
    AND p.is_active = TRUE
    AND p.status = 'published'
    AND b.is_active = TRUE
  ORDER BY 
    p.is_featured DESC,
    p.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;

-- Conceder permissão pública (anon role)
GRANT EXECUTE ON FUNCTION public.get_public_properties_by_broker(TEXT, INT, INT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_properties_by_broker(TEXT, INT, INT) TO authenticated;

-- Comentário explicativo
COMMENT ON FUNCTION public.get_public_properties_by_broker IS 'Retorna propriedades públicas ativas de um broker específico pelo website_slug. Usado pelo site público.';
