-- ==========================================
-- SCRIPT DE MIGRAÇÃO FINAL INTEGRADA
-- Combina auditoria + correção em um único arquivo para execução simples
-- ==========================================

-- 1. VERIFICAR E ADICIONAR COLUNAS AUSENTES
-- ==========================================

DO $$
BEGIN
    -- Adicionar is_public se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'properties' AND column_name = 'is_public'
    ) THEN
        ALTER TABLE properties ADD COLUMN is_public BOOLEAN DEFAULT true;
        RAISE NOTICE 'Coluna is_public adicionada';
    END IF;

    -- Adicionar is_active se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'properties' AND column_name = 'is_active'
    ) THEN
        ALTER TABLE properties ADD COLUMN is_active BOOLEAN DEFAULT true;
        RAISE NOTICE 'Coluna is_active adicionada';
    END IF;

    -- Adicionar views_count se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'properties' AND column_name = 'views_count'
    ) THEN
        ALTER TABLE properties ADD COLUMN views_count INTEGER DEFAULT 0;
        RAISE NOTICE 'Coluna views_count adicionada';
    END IF;

    -- Adicionar neighborhood se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'properties' AND column_name = 'neighborhood'
    ) THEN
        ALTER TABLE properties ADD COLUMN neighborhood TEXT;
        RAISE NOTICE 'Coluna neighborhood adicionada';
    END IF;

    -- Adicionar show_views_count se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'properties' AND column_name = 'show_views_count'
    ) THEN
        ALTER TABLE properties ADD COLUMN show_views_count BOOLEAN DEFAULT true;
        RAISE NOTICE 'Coluna show_views_count adicionada';
    END IF;

    -- Adicionar show_neighborhood se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'properties' AND column_name = 'show_neighborhood'
    ) THEN
        ALTER TABLE properties ADD COLUMN show_neighborhood BOOLEAN DEFAULT true;
        RAISE NOTICE 'Coluna show_neighborhood adicionada';
    END IF;

END $$;

-- 2. NORMALIZAR DADOS EXISTENTES
-- ==========================================

-- Garantir que todas as propriedades tenham configurações padrão
UPDATE properties 
SET 
    is_public = COALESCE(is_public, true),
    is_active = COALESCE(is_active, true),
    views_count = COALESCE(views_count, 0),
    show_views_count = COALESCE(show_views_count, true),
    show_neighborhood = COALESCE(show_neighborhood, true),
    neighborhood = CASE 
        WHEN neighborhood IS NULL OR neighborhood = '' 
        THEN 'Bairro não informado' 
        ELSE neighborhood 
    END
WHERE 
    is_public IS NULL 
    OR is_active IS NULL 
    OR views_count IS NULL 
    OR show_views_count IS NULL 
    OR show_neighborhood IS NULL
    OR neighborhood IS NULL 
    OR neighborhood = '';

-- 3. POLÍTICAS RLS ATUALIZADAS
-- ==========================================

-- Remover políticas antigas que podem estar causando conflito
DROP POLICY IF EXISTS "Public site can view published properties" ON properties;
DROP POLICY IF EXISTS "Public can view active properties" ON properties;
DROP POLICY IF EXISTS "Public access to properties" ON properties;
DROP POLICY IF EXISTS "public_site_access_properties" ON properties;

-- Política DEFINITIVA para acesso público
CREATE POLICY "public_site_access_properties" 
ON properties 
FOR SELECT 
USING (
    COALESCE(is_public, false) = true 
    AND COALESCE(is_active, false) = true 
    AND COALESCE(status, 'available') IN ('available', 'reserved')
);

-- 4. FUNÇÕES RPC ATUALIZADAS
-- ==========================================

-- Função para homepage com categorias
DROP FUNCTION IF EXISTS get_homepage_categories_with_properties(TEXT, TEXT);

CREATE OR REPLACE FUNCTION get_homepage_categories_with_properties(
    broker_slug_param TEXT DEFAULT NULL,
    custom_domain_param TEXT DEFAULT NULL
)
RETURNS TABLE (
    category_id UUID,
    category_name TEXT,
    category_color TEXT,
    category_icon TEXT,
    display_order INTEGER,
    properties JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    target_broker_id UUID;
BEGIN
    -- Determinar broker baseado nos parâmetros
    IF custom_domain_param IS NOT NULL AND custom_domain_param != '' THEN
        SELECT b.id INTO target_broker_id
        FROM brokers b
        WHERE b.custom_domain = custom_domain_param
        AND COALESCE(b.is_active, false) = true;
    ELSIF broker_slug_param IS NOT NULL AND broker_slug_param != '' THEN
        SELECT b.id INTO target_broker_id
        FROM brokers b
        WHERE b.slug = broker_slug_param
        AND COALESCE(b.is_active, false) = true;
    END IF;

    -- Se não encontrou broker, retornar vazio
    IF target_broker_id IS NULL THEN
        RETURN;
    END IF;

    -- Retornar categorias com suas propriedades (dados sempre completos)
    RETURN QUERY
    SELECT DISTINCT
        pc.id as category_id,
        pc.name as category_name,
        COALESCE(pc.color, '#3B82F6') as category_color,
        COALESCE(pc.icon, 'Home') as category_icon,
        COALESCE(pc.display_order, 999) as display_order,
        COALESCE(
            (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', p.id,
                        'title', p.title,
                        'price', p.price,
                        'address', p.address,
                        'neighborhood', CASE 
                            WHEN COALESCE(p.show_neighborhood, true) = true 
                            THEN COALESCE(p.neighborhood, 'Bairro não informado')
                            ELSE NULL
                        END,
                        'bedrooms', p.bedrooms,
                        'bathrooms', p.bathrooms,
                        'area', p.area,
                        'slug', p.slug,
                        'images', COALESCE(p.images, '[]'::jsonb),
                        'views_count', CASE 
                            WHEN COALESCE(p.show_views_count, true) = true 
                            THEN COALESCE(p.views_count, 0)
                            ELSE 0
                        END,
                        'status', COALESCE(p.status, 'available'),
                        'created_at', p.created_at
                    )
                    ORDER BY p.created_at DESC
                )
                FROM properties p
                JOIN property_category_assignments pca ON pca.property_id = p.id
                WHERE pca.category_id = pc.id
                AND p.broker_id = target_broker_id
                AND COALESCE(p.is_public, false) = true
                AND COALESCE(p.is_active, false) = true
                AND COALESCE(p.status, 'available') IN ('available', 'reserved')
                LIMIT 6
            ),
            '[]'::jsonb
        ) as properties
    FROM property_categories pc
    WHERE pc.broker_id = target_broker_id
    AND EXISTS (
        SELECT 1 
        FROM property_category_assignments pca
        JOIN properties p ON p.id = pca.property_id
        WHERE pca.category_id = pc.id
        AND p.broker_id = target_broker_id
        AND COALESCE(p.is_public, false) = true
        AND COALESCE(p.is_active, false) = true
        AND COALESCE(p.status, 'available') IN ('available', 'reserved')
    )
    ORDER BY COALESCE(pc.display_order, 999), pc.name;
END;
$$;

-- Função para propriedades públicas
DROP FUNCTION IF EXISTS get_public_properties(TEXT, TEXT, INT, INT);

CREATE OR REPLACE FUNCTION get_public_properties(
    broker_slug_param TEXT DEFAULT NULL,
    custom_domain_param TEXT DEFAULT NULL,
    limit_param INT DEFAULT 50,
    offset_param INT DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    price DECIMAL,
    address TEXT,
    neighborhood TEXT,
    bedrooms INTEGER,
    bathrooms INTEGER,
    area DECIMAL,
    slug TEXT,
    images JSONB,
    broker_id UUID,
    broker_name TEXT,
    broker_slug TEXT,
    views_count INTEGER,
    show_views_count BOOLEAN,
    show_neighborhood BOOLEAN,
    status TEXT,
    created_at TIMESTAMPTZ,
    categories JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    target_broker_id UUID;
BEGIN
    -- Determinar broker baseado nos parâmetros
    IF custom_domain_param IS NOT NULL AND custom_domain_param != '' THEN
        SELECT b.id INTO target_broker_id
        FROM brokers b
        WHERE b.custom_domain = custom_domain_param
        AND COALESCE(b.is_active, false) = true;
    ELSIF broker_slug_param IS NOT NULL AND broker_slug_param != '' THEN
        SELECT b.id INTO target_broker_id
        FROM brokers b
        WHERE b.slug = broker_slug_param
        AND COALESCE(b.is_active, false) = true;
    END IF;

    -- Se não encontrou broker, retornar vazio
    IF target_broker_id IS NULL THEN
        RETURN;
    END IF;

    -- Retornar propriedades públicas com TODAS as informações (sempre completas)
    RETURN QUERY
    SELECT 
        p.id,
        p.title,
        p.description,
        p.price,
        p.address,
        CASE 
            WHEN COALESCE(p.show_neighborhood, true) = true 
            THEN COALESCE(p.neighborhood, 'Bairro não informado')
            ELSE NULL
        END as neighborhood,
        p.bedrooms,
        p.bathrooms,
        p.area,
        p.slug,
        COALESCE(p.images, '[]'::jsonb) as images,
        p.broker_id,
        b.name as broker_name,
        b.slug as broker_slug,
        CASE 
            WHEN COALESCE(p.show_views_count, true) = true 
            THEN COALESCE(p.views_count, 0)
            ELSE 0
        END as views_count,
        COALESCE(p.show_views_count, true) as show_views_count,
        COALESCE(p.show_neighborhood, true) as show_neighborhood,
        COALESCE(p.status, 'available') as status,
        p.created_at,
        COALESCE(
            (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', pc.id,
                        'name', pc.name,
                        'color', COALESCE(pc.color, '#3B82F6'),
                        'icon', COALESCE(pc.icon, 'Home')
                    )
                )
                FROM property_category_assignments pca
                JOIN property_categories pc ON pc.id = pca.category_id
                WHERE pca.property_id = p.id
            ),
            '[]'::jsonb
        ) as categories
    FROM properties p
    JOIN brokers b ON b.id = p.broker_id
    WHERE 
        p.broker_id = target_broker_id
        AND COALESCE(p.is_public, false) = true
        AND COALESCE(p.is_active, false) = true
        AND COALESCE(p.status, 'available') IN ('available', 'reserved')
        AND COALESCE(b.is_active, false) = true
    ORDER BY p.created_at DESC
    LIMIT limit_param
    OFFSET offset_param;
END;
$$;

-- 5. ÍNDICES DE PERFORMANCE
-- ==========================================

-- Índices para consultas do site público
CREATE INDEX IF NOT EXISTS idx_properties_public_active 
ON properties (broker_id, is_public, is_active, status) 
WHERE is_public = true AND is_active = true;

CREATE INDEX IF NOT EXISTS idx_properties_slug_broker 
ON properties (slug, broker_id) 
WHERE is_public = true AND is_active = true;

-- 6. RELATÓRIO FINAL
-- ==========================================

DO $$
BEGIN
    RAISE NOTICE '=== MIGRAÇÃO COMPLETA FINALIZADA ===';
    RAISE NOTICE 'Estrutura do banco atualizada para garantir dados consistentes no site público';
    RAISE NOTICE 'Próximos passos:';
    RAISE NOTICE '1. Testar site público - informações devem aparecer consistentemente';
    RAISE NOTICE '2. Verificar que views_count e neighborhood sempre aparecem';
    RAISE NOTICE '3. Confirmar que refresh não remove mais informações';
END $$;

-- Verificar dados finais
SELECT 
    'Propriedades públicas e ativas' as metric,
    COUNT(*) as total,
    COUNT(CASE WHEN neighborhood IS NOT NULL AND neighborhood != '' THEN 1 END) as with_neighborhood,
    COUNT(CASE WHEN views_count IS NOT NULL THEN 1 END) as with_views_count
FROM properties 
WHERE COALESCE(is_public, false) = true 
AND COALESCE(is_active, false) = true;