-- =====================================================
-- SISTEMA DE CATEGORIAS PERSONALIZADAS PARA IMÓVEIS
-- =====================================================
-- 
-- Permite que cada imobiliária crie suas próprias categorias
-- e organize a ordem de exibição no site público
--
-- Exemplos de categorias:
-- - Imóveis em Destaque
-- - Lançamentos
-- - Oportunidades
-- - Alto Padrão
-- - Praia
-- - Campo
-- - Investimento
-- - Pronto para Morar
-- =====================================================

-- 1. Tabela de Categorias (customizável por imobiliária)
CREATE TABLE IF NOT EXISTS property_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id UUID NOT NULL REFERENCES brokers(id) ON DELETE CASCADE,
  
  -- Dados da categoria
  name VARCHAR(100) NOT NULL, -- Ex: "Lançamentos", "Alto Padrão"
  slug VARCHAR(100) NOT NULL, -- Ex: "lancamentos", "alto-padrao"
  description TEXT, -- Descrição opcional para SEO
  
  -- Customização visual
  color VARCHAR(7), -- Hex color para badge/tema da categoria
  icon VARCHAR(50), -- Nome do ícone (lucide-react)
  
  -- Controle de exibição
  display_order INTEGER NOT NULL DEFAULT 0, -- Ordem de exibição (0 = primeira)
  is_active BOOLEAN NOT NULL DEFAULT true, -- Mostrar/ocultar categoria
  show_on_homepage BOOLEAN NOT NULL DEFAULT true, -- Exibir na home pública
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Índices compostos para performance
  UNIQUE(broker_id, slug),
  CONSTRAINT name_length CHECK (char_length(name) >= 2)
);

-- Índices para otimização
CREATE INDEX idx_property_categories_broker_id ON property_categories(broker_id);
CREATE INDEX idx_property_categories_active ON property_categories(broker_id, is_active, show_on_homepage, display_order);

-- 2. Tabela de Associação Imóvel-Categoria (Many-to-Many)
CREATE TABLE IF NOT EXISTS property_category_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES property_categories(id) ON DELETE CASCADE,
  broker_id UUID NOT NULL REFERENCES brokers(id) ON DELETE CASCADE,
  
  -- Controle
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  assigned_by UUID REFERENCES auth.users(id), -- Quem associou
  
  -- Um imóvel não pode estar na mesma categoria duas vezes
  UNIQUE(property_id, category_id)
);

-- Índices para queries rápidas
CREATE INDEX idx_property_category_assignments_property ON property_category_assignments(property_id);
CREATE INDEX idx_property_category_assignments_category ON property_category_assignments(category_id);
CREATE INDEX idx_property_category_assignments_broker ON property_category_assignments(broker_id);

-- 3. Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_property_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_property_categories_updated_at
  BEFORE UPDATE ON property_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_property_categories_updated_at();

-- 4. Function para validar display_order único por broker
CREATE OR REPLACE FUNCTION validate_category_display_order()
RETURNS TRIGGER AS $$
BEGIN
  -- Se já existe outra categoria com a mesma ordem, incrementar as demais
  IF EXISTS (
    SELECT 1 FROM property_categories 
    WHERE broker_id = NEW.broker_id 
    AND display_order = NEW.display_order 
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) THEN
    -- Incrementar ordem de todas as categorias >= nova ordem
    UPDATE property_categories
    SET display_order = display_order + 1
    WHERE broker_id = NEW.broker_id
    AND display_order >= NEW.display_order
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_category_display_order
  BEFORE INSERT OR UPDATE ON property_categories
  FOR EACH ROW
  EXECUTE FUNCTION validate_category_display_order();

-- 5. RLS (Row Level Security)
ALTER TABLE property_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_category_assignments ENABLE ROW LEVEL SECURITY;

-- Policy: Broker pode ver apenas suas categorias
CREATE POLICY "Brokers can view own categories"
  ON property_categories
  FOR SELECT
  USING (
    broker_id IN (
      SELECT id FROM brokers WHERE user_id = auth.uid()
    )
  );

-- Policy: Broker pode criar categorias
CREATE POLICY "Brokers can create categories"
  ON property_categories
  FOR INSERT
  WITH CHECK (
    broker_id IN (
      SELECT id FROM brokers WHERE user_id = auth.uid()
    )
  );

-- Policy: Broker pode editar próprias categorias
CREATE POLICY "Brokers can update own categories"
  ON property_categories
  FOR UPDATE
  USING (
    broker_id IN (
      SELECT id FROM brokers WHERE user_id = auth.uid()
    )
  );

-- Policy: Broker pode deletar próprias categorias
CREATE POLICY "Brokers can delete own categories"
  ON property_categories
  FOR DELETE
  USING (
    broker_id IN (
      SELECT id FROM brokers WHERE user_id = auth.uid()
    )
  );

-- Policy: Público pode ver categorias ativas
CREATE POLICY "Public can view active categories"
  ON property_categories
  FOR SELECT
  USING (is_active = true AND show_on_homepage = true);

-- Policy: Broker pode ver próprias associações
CREATE POLICY "Brokers can view own category assignments"
  ON property_category_assignments
  FOR SELECT
  USING (
    broker_id IN (
      SELECT id FROM brokers WHERE user_id = auth.uid()
    )
  );

-- Policy: Broker pode criar associações
CREATE POLICY "Brokers can create category assignments"
  ON property_category_assignments
  FOR INSERT
  WITH CHECK (
    broker_id IN (
      SELECT id FROM brokers WHERE user_id = auth.uid()
    )
  );

-- Policy: Broker pode deletar associações
CREATE POLICY "Brokers can delete category assignments"
  ON property_category_assignments
  FOR DELETE
  USING (
    broker_id IN (
      SELECT id FROM brokers WHERE user_id = auth.uid()
    )
  );

-- 6. Criar categorias padrão para brokers existentes
INSERT INTO property_categories (broker_id, name, slug, description, display_order, color, icon)
SELECT 
  id,
  'Imóveis em Destaque',
  'destaque',
  'Propriedades selecionadas especialmente para você',
  1,
  '#2563eb',
  'Star'
FROM brokers
WHERE NOT EXISTS (
  SELECT 1 FROM property_categories 
  WHERE property_categories.broker_id = brokers.id 
  AND property_categories.slug = 'destaque'
);

INSERT INTO property_categories (broker_id, name, slug, description, display_order, color, icon)
SELECT 
  id,
  'Todos os Imóveis',
  'todos',
  'Explore nossa seleção completa de propriedades',
  2,
  '#64748b',
  'Home'
FROM brokers
WHERE NOT EXISTS (
  SELECT 1 FROM property_categories 
  WHERE property_categories.broker_id = brokers.id 
  AND property_categories.slug = 'todos'
);

-- 7. Migrar imóveis marcados como is_featured para categoria "Destaque"
INSERT INTO property_category_assignments (property_id, category_id, broker_id)
SELECT 
  p.id,
  pc.id,
  p.broker_id
FROM properties p
INNER JOIN property_categories pc ON pc.broker_id = p.broker_id AND pc.slug = 'destaque'
WHERE p.is_featured = true
ON CONFLICT (property_id, category_id) DO NOTHING;

-- 8. Function Helper: Obter categorias com contagem de imóveis
CREATE OR REPLACE FUNCTION get_broker_categories_with_counts(p_broker_id UUID)
RETURNS TABLE (
  id UUID,
  name VARCHAR,
  slug VARCHAR,
  description TEXT,
  color VARCHAR,
  icon VARCHAR,
  display_order INTEGER,
  is_active BOOLEAN,
  show_on_homepage BOOLEAN,
  properties_count BIGINT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pc.id,
    pc.name,
    pc.slug,
    pc.description,
    pc.color,
    pc.icon,
    pc.display_order,
    pc.is_active,
    pc.show_on_homepage,
    COUNT(DISTINCT pca.property_id) AS properties_count,
    pc.created_at,
    pc.updated_at
  FROM property_categories pc
  LEFT JOIN property_category_assignments pca ON pca.category_id = pc.id
  WHERE pc.broker_id = p_broker_id
  GROUP BY pc.id
  ORDER BY pc.display_order ASC, pc.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 9. Function Helper: Obter imóveis de uma categoria
CREATE OR REPLACE FUNCTION get_category_properties(
  p_broker_id UUID,
  p_category_slug VARCHAR,
  p_limit INTEGER DEFAULT 12
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  slug VARCHAR,
  price NUMERIC,
  main_image_url TEXT,
  images TEXT[],
  property_type VARCHAR,
  transaction_type VARCHAR,
  bedrooms INTEGER,
  bathrooms INTEGER,
  area_m2 NUMERIC,
  city VARCHAR,
  uf VARCHAR,
  neighborhood VARCHAR,
  views_count INTEGER,
  is_featured BOOLEAN,
  property_code VARCHAR,
  address TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.slug,
    p.price,
    p.main_image_url,
    p.images,
    p.property_type,
    p.transaction_type,
    p.bedrooms,
    p.bathrooms,
    p.area_m2,
    p.city,
    p.uf,
    p.neighborhood,
    p.views_count,
    p.is_featured,
    p.property_code,
    p.address
  FROM properties p
  INNER JOIN property_category_assignments pca ON pca.property_id = p.id
  INNER JOIN property_categories pc ON pc.id = pca.category_id
  WHERE pc.broker_id = p_broker_id
  AND pc.slug = p_category_slug
  AND pc.is_active = true
  AND p.status = 'active'
  ORDER BY pca.assigned_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- 10. Function Helper: Obter todas categorias com seus imóveis (para HomePage)
CREATE OR REPLACE FUNCTION get_homepage_categories_with_properties(
  p_broker_id UUID,
  p_properties_per_category INTEGER DEFAULT 12
)
RETURNS TABLE (
  category_id UUID,
  category_name VARCHAR,
  category_slug VARCHAR,
  category_description TEXT,
  category_color VARCHAR,
  category_icon VARCHAR,
  category_display_order INTEGER,
  properties JSON
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pc.id,
    pc.name,
    pc.slug,
    pc.description,
    pc.color,
    pc.icon,
    pc.display_order,
    (
      SELECT json_agg(row_to_json(props))
      FROM (
        SELECT 
          p.id,
          p.title,
          p.slug,
          p.price,
          p.main_image_url,
          p.images,
          p.property_type,
          p.transaction_type,
          p.bedrooms,
          p.bathrooms,
          p.area_m2,
          p.city,
          p.uf,
          p.neighborhood,
          p.views_count,
          p.is_featured,
          p.property_code,
          p.address,
          p.parking_spaces
        FROM properties p
        INNER JOIN property_category_assignments pca ON pca.property_id = p.id
        WHERE pca.category_id = pc.id
        AND p.status = 'active'
        ORDER BY pca.assigned_at DESC
        LIMIT p_properties_per_category
      ) props
    ) AS properties
  FROM property_categories pc
  WHERE pc.broker_id = p_broker_id
  AND pc.is_active = true
  AND pc.show_on_homepage = true
  ORDER BY pc.display_order ASC;
END;
$$ LANGUAGE plpgsql;

-- 11. Comentários para documentação
COMMENT ON TABLE property_categories IS 'Categorias personalizáveis criadas por cada imobiliária';
COMMENT ON TABLE property_category_assignments IS 'Associação many-to-many entre imóveis e categorias';
COMMENT ON COLUMN property_categories.display_order IS 'Ordem de exibição na home pública (0 = primeira posição)';
COMMENT ON COLUMN property_categories.show_on_homepage IS 'Se false, categoria existe mas não aparece na home';
COMMENT ON FUNCTION get_broker_categories_with_counts IS 'Retorna categorias do broker com contagem de imóveis';
COMMENT ON FUNCTION get_category_properties IS 'Retorna imóveis de uma categoria específica';
COMMENT ON FUNCTION get_homepage_categories_with_properties IS 'Retorna todas categorias ativas com seus imóveis (otimizado para HomePage)';

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================

-- Verificação final
DO $$
BEGIN
  RAISE NOTICE '✅ Sistema de Categorias criado com sucesso!';
  RAISE NOTICE '📊 Tabelas: property_categories, property_category_assignments';
  RAISE NOTICE '🔒 RLS habilitado com policies';
  RAISE NOTICE '⚡ Functions: get_broker_categories_with_counts, get_category_properties, get_homepage_categories_with_properties';
  RAISE NOTICE '🎯 Categorias padrão criadas para brokers existentes';
END $$;
