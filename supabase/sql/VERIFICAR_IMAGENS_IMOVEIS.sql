-- ============================================================================
-- VERIFICAÇÃO: Imagens dos Imóveis para Compartilhamento
-- Execute no SQL Editor do Supabase para verificar se imóveis têm imagens
-- ============================================================================

-- 1. Verificar imóveis SEM imagem principal
SELECT 
  p.id,
  p.title,
  p.slug,
  p.main_image_url,
  p.is_published,
  b.business_name AS broker_name,
  b.site_share_image_url AS broker_fallback_image
FROM properties p
JOIN brokers b ON b.id = p.broker_id
WHERE p.is_published = true
  AND (p.main_image_url IS NULL OR p.main_image_url = '')
ORDER BY p.created_at DESC
LIMIT 20;

-- 2. Verificar brokers SEM imagem de compartilhamento
SELECT 
  id,
  business_name,
  website_slug,
  site_share_image_url,
  header_brand_image_url,
  logo_url,
  CASE 
    WHEN site_share_image_url IS NOT NULL THEN '✅ Tem imagem de compartilhamento'
    WHEN header_brand_image_url IS NOT NULL THEN '⚠️ Pode usar header como fallback'
    WHEN logo_url IS NOT NULL THEN '⚠️ Pode usar logo como fallback'
    ELSE '❌ SEM IMAGEM - Precisa cadastrar'
  END as status
FROM brokers
WHERE is_active = true
ORDER BY business_name;

-- 3. Estatísticas gerais
SELECT 
  COUNT(*) FILTER (WHERE p.main_image_url IS NOT NULL AND p.main_image_url != '') AS imoveis_com_imagem,
  COUNT(*) FILTER (WHERE p.main_image_url IS NULL OR p.main_image_url = '') AS imoveis_sem_imagem,
  COUNT(*) AS total_imoveis,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE p.main_image_url IS NOT NULL AND p.main_image_url != '') / 
    NULLIF(COUNT(*), 0), 
    2
  ) AS percentual_com_imagem
FROM properties p
WHERE p.is_published = true;

-- 4. Verificar URLs de imagens quebradas (não começam com http)
SELECT 
  p.id,
  p.title,
  p.main_image_url,
  CASE 
    WHEN p.main_image_url LIKE 'http%' THEN '✅ URL absoluta (OK)'
    WHEN p.main_image_url LIKE '/%' THEN '⚠️ URL relativa (precisa ajustar)'
    ELSE '❌ URL inválida'
  END as status_url
FROM properties p
WHERE p.is_published = true
  AND p.main_image_url IS NOT NULL 
  AND p.main_image_url != ''
ORDER BY p.created_at DESC
LIMIT 20;
