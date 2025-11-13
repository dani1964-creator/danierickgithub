-- ========================================
-- ADICIONAR CAMPOS DE SLUG E DOMÍNIO PERSONALIZADO
-- ========================================

-- 1. Adicionar campo website_slug (subdomínio amigável)
ALTER TABLE brokers 
ADD COLUMN IF NOT EXISTS website_slug TEXT UNIQUE;

-- 2. Adicionar campo custom_domain (domínio personalizado)
ALTER TABLE brokers 
ADD COLUMN IF NOT EXISTS custom_domain TEXT UNIQUE;

-- 3. Adicionar campo custom_domain_verified (status da verificação DNS)
ALTER TABLE brokers 
ADD COLUMN IF NOT EXISTS custom_domain_verified BOOLEAN DEFAULT false;

-- 4. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_brokers_website_slug ON brokers(website_slug);
CREATE INDEX IF NOT EXISTS idx_brokers_custom_domain ON brokers(custom_domain);

-- 5. Comentários nas colunas
COMMENT ON COLUMN brokers.website_slug IS 'Slug amigável para subdomínio (ex: danierick em danierick.adminimobiliaria.site)';
COMMENT ON COLUMN brokers.custom_domain IS 'Domínio personalizado configurado pelo broker (ex: imobiliariajoao.com.br)';
COMMENT ON COLUMN brokers.custom_domain_verified IS 'Indica se o domínio personalizado foi verificado via DNS';

-- 6. Popular website_slug para brokers existentes (baseado no email ou business_name)
UPDATE brokers 
SET website_slug = LOWER(REGEXP_REPLACE(
  REGEXP_REPLACE(business_name, '[^a-zA-Z0-9\s-]', '', 'g'),
  '\s+', '-', 'g'
))
WHERE website_slug IS NULL;

-- 7. Garantir que slugs sejam únicos adicionando sufixo numérico se necessário
WITH numbered_rows AS (
  SELECT 
    id,
    website_slug,
    ROW_NUMBER() OVER (PARTITION BY website_slug ORDER BY created_at) as rn
  FROM brokers
)
UPDATE brokers b
SET website_slug = CONCAT(nr.website_slug, '-', nr.rn)
FROM numbered_rows nr
WHERE b.id = nr.id AND nr.rn > 1;

-- ========================================
-- FUNÇÃO HELPER: IDENTIFICAR BROKER POR DOMÍNIO
-- ========================================

CREATE OR REPLACE FUNCTION get_broker_by_domain(input_domain TEXT)
RETURNS TABLE (
  broker_id UUID,
  business_name TEXT,
  website_slug TEXT,
  custom_domain TEXT,
  is_custom_domain BOOLEAN
) AS $$
BEGIN
  -- Primeiro, tentar encontrar por domínio personalizado
  RETURN QUERY
  SELECT 
    b.id,
    b.business_name,
    b.website_slug,
    b.custom_domain,
    true as is_custom_domain
  FROM brokers b
  WHERE b.custom_domain = input_domain
    AND b.custom_domain_verified = true
    AND b.is_active = true
  LIMIT 1;

  -- Se não encontrou, tentar extrair slug do subdomínio
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      b.id,
      b.business_name,
      b.website_slug,
      b.custom_domain,
      false as is_custom_domain
    FROM brokers b
    WHERE b.website_slug = SPLIT_PART(input_domain, '.', 1)
      AND b.is_active = true
    LIMIT 1;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- VIEWS ÚTEIS
-- ========================================

-- View para listar todos os domínios (slugs + personalizados) de cada broker
CREATE OR REPLACE VIEW broker_domains AS
SELECT 
  b.id as broker_id,
  b.business_name,
  b.website_slug,
  b.custom_domain,
  b.custom_domain_verified,
  CONCAT(b.website_slug, '.', 
    COALESCE((SELECT current_setting('app.base_domain', true)), 'adminimobiliaria.site')
  ) as subdomain_url,
  CONCAT(b.website_slug, '.painel.', 
    COALESCE((SELECT current_setting('app.base_domain', true)), 'adminimobiliaria.site')
  ) as panel_url,
  CASE 
    WHEN b.custom_domain_verified THEN b.custom_domain
    ELSE NULL
  END as public_url
FROM brokers b
WHERE b.is_active = true;

COMMENT ON VIEW broker_domains IS 'Lista todos os domínios (subdomínios e personalizados) de cada broker ativo';
