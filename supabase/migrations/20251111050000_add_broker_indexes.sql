-- Migration para adicionar índices de performance em brokers
-- Otimiza lookup por custom_domain e website_slug

-- Índice único para custom_domain (garante que não há domínios duplicados)
-- Usa lower() para case-insensitive e WHERE para ignorar NULLs
CREATE UNIQUE INDEX IF NOT EXISTS idx_brokers_custom_domain_unique 
ON public.brokers (lower(custom_domain)) 
WHERE custom_domain IS NOT NULL;

-- Índice para website_slug (acelera lookups por subdomínio)
CREATE INDEX IF NOT EXISTS idx_brokers_website_slug 
ON public.brokers (website_slug) 
WHERE is_active = true;

-- Índice composto para a query mais comum: lookup ativo por slug
CREATE INDEX IF NOT EXISTS idx_brokers_active_slug 
ON public.brokers (website_slug, is_active);

-- Comentários explicativos
COMMENT ON INDEX idx_brokers_custom_domain_unique IS 'Garante unicidade de domínios customizados (case-insensitive)';
COMMENT ON INDEX idx_brokers_website_slug IS 'Acelera lookup por website_slug para brokers ativos';
COMMENT ON INDEX idx_brokers_active_slug IS 'Índice composto para queries de broker ativo por slug';
