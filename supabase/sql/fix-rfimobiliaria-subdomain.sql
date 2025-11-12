-- ============================================================================
-- FIX: Corrigir subdomain do broker rfimobiliaria
-- ============================================================================
-- Problema: subdomain está como "danierick" mas deveria ser "rfimobiliaria"
-- Causa: Admin panel não estava atualizando o banco (TODO placeholders)
-- Solução: Atualizar manualmente via SQL
-- ============================================================================

-- 1. Verificar estado atual
SELECT 
    id,
    business_name,
    website_slug,
    subdomain,
    custom_domain,
    is_active,
    updated_at
FROM public.brokers
WHERE website_slug = 'rfimobiliaria' OR subdomain IN ('danierick', 'rfimobiliaria');

-- 2. Atualizar subdomain para "rfimobiliaria"
UPDATE public.brokers 
SET 
    subdomain = 'rfimobiliaria',
    updated_at = NOW()
WHERE id = '1e7b21c7-1727-4741-8b89-dcddc406ce06'
  AND website_slug = 'rfimobiliaria';

-- 3. Verificar atualização
SELECT 
    id,
    business_name,
    website_slug,
    subdomain,
    custom_domain,
    is_active,
    updated_at
FROM public.brokers
WHERE website_slug = 'rfimobiliaria';

-- 4. Testar query de resolução (igual ao BrokerResolver)
SELECT id, business_name, website_slug, subdomain, custom_domain, is_active
FROM public.brokers 
WHERE (subdomain = 'rfimobiliaria' OR website_slug = 'rfimobiliaria')
  AND is_active = true
LIMIT 1;

-- ============================================================================
-- Resultado esperado após atualização:
-- ============================================================================
-- id:              1e7b21c7-1727-4741-8b89-dcddc406ce06
-- business_name:   R&F imobiliaria
-- website_slug:    rfimobiliaria
-- subdomain:       rfimobiliaria (CORRIGIDO!)
-- custom_domain:   NULL
-- is_active:       true
-- ============================================================================

-- ============================================================================
-- APÓS EXECUTAR ESTE SQL:
-- ============================================================================
-- 1. Aguardar deploy do DigitalOcean (já foi feito push das correções)
-- 2. Testar: https://rfimobiliaria.adminimobiliaria.site
-- 3. Deve carregar sem erro 404
-- ============================================================================
