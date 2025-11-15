-- ============================================================================
-- CORREÇÃO: Padronizar imagens de compartilhamento dos brokers
-- Execute no SQL Editor do Supabase
-- ============================================================================

-- 1. Padronizar campos vazios ("") para NULL
UPDATE brokers
SET site_share_image_url = NULL
WHERE site_share_image_url = '';

-- Resultado esperado: 1 row updated (imobi teste)

-- 2. Usar header_brand_image_url como fallback para brokers sem site_share_image_url
UPDATE brokers
SET site_share_image_url = header_brand_image_url
WHERE (site_share_image_url IS NULL OR site_share_image_url = '')
  AND header_brand_image_url IS NOT NULL
  AND header_brand_image_url != '';

-- Resultado esperado: Até 2 rows updated (AugustusEmperor, terceira imob)

-- 3. Usar logo_url como fallback se header também não existir
UPDATE brokers
SET site_share_image_url = logo_url
WHERE (site_share_image_url IS NULL OR site_share_image_url = '')
  AND (header_brand_image_url IS NULL OR header_brand_image_url = '')
  AND logo_url IS NOT NULL
  AND logo_url != '';

-- 4. Verificar resultado final
SELECT 
  id,
  business_name,
  website_slug,
  site_share_image_url,
  header_brand_image_url,
  logo_url,
  CASE 
    WHEN site_share_image_url IS NOT NULL AND site_share_image_url != '' THEN '✅ OK - Tem imagem de compartilhamento'
    WHEN header_brand_image_url IS NOT NULL THEN '⚠️ Pode copiar do header manualmente'
    WHEN logo_url IS NOT NULL THEN '⚠️ Pode copiar do logo manualmente'
    ELSE '❌ SEM IMAGEM - Precisa cadastrar urgente'
  END as status
FROM brokers
WHERE is_active = true
ORDER BY business_name;

-- ============================================================================
-- RESULTADO ESPERADO APÓS EXECUÇÃO:
-- 
-- ✅ Todos os brokers com site_share_image_url preenchida
-- ✅ Nenhum campo vazio ("")
-- ✅ Compartilhamento de imóveis funcionando para todos
-- ============================================================================
