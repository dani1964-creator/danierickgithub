-- ==========================================
-- CORREÇÃO DE INCONSISTÊNCIAS ESPECÍFICAS
-- Script complementar para resolver problemas de dados que aparecem/desaparecem
-- ==========================================

-- 1. VERIFICAR E CORRIGIR DADOS AUSENTES
-- ==========================================

-- Atualizar propriedades que não têm bairro definido
UPDATE properties 
SET neighborhood = 'Bairro não informado'
WHERE (neighborhood IS NULL OR neighborhood = '')
AND is_public = true 
AND is_active = true;

-- Garantir que todas as propriedades públicas tenham views_count
UPDATE properties 
SET views_count = 0
WHERE views_count IS NULL 
AND is_public = true 
AND is_active = true;

-- Garantir configurações de exibição para propriedades ativas
UPDATE properties 
SET 
    show_views_count = true,
    show_neighborhood = true
WHERE is_public = true 
AND is_active = true 
AND (show_views_count IS NULL OR show_neighborhood IS NULL);

-- ==========================================
-- 2. FUNÇÃO RPC PARA HOMEPAGE (CONSISTENTE)
-- ==========================================

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
        AND b.is_active = true;
    ELSIF broker_slug_param IS NOT NULL AND broker_slug_param != '' THEN
        SELECT b.id INTO target_broker_id
        FROM brokers b
        WHERE b.slug = broker_slug_param
        AND b.is_active = true;
    END IF;

    -- Se não encontrou broker, retornar vazio
    IF target_broker_id IS NULL THEN
        RETURN;
    END IF;

    -- Retornar categorias com suas propriedades
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

-- ==========================================
-- 3. FUNÇÃO RPC PARA DETALHES DE IMÓVEL
-- ==========================================

DROP FUNCTION IF EXISTS get_property_by_slug(TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION get_property_by_slug(
    property_slug_param TEXT,
    broker_slug_param TEXT DEFAULT NULL,
    custom_domain_param TEXT DEFAULT NULL
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
    categories JSONB,
    broker_info JSONB
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
        AND b.is_active = true;
    ELSIF broker_slug_param IS NOT NULL AND broker_slug_param != '' THEN
        SELECT b.id INTO target_broker_id
        FROM brokers b
        WHERE b.slug = broker_slug_param
        AND b.is_active = true;
    END IF;

    -- Se não encontrou broker, retornar vazio
    IF target_broker_id IS NULL THEN
        RETURN;
    END IF;

    -- Retornar dados da propriedade
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
        ) as categories,
        jsonb_build_object(
            'name', b.name,
            'slug', b.slug,
            'email', b.email,
            'phone', b.phone,
            'custom_domain', b.custom_domain,
            'logo_url', b.logo_url,
            'primary_color', COALESCE(b.primary_color, '#3B82F6'),
            'secondary_color', COALESCE(b.secondary_color, '#1F2937')
        ) as broker_info
    FROM properties p
    JOIN brokers b ON b.id = p.broker_id
    WHERE 
        p.slug = property_slug_param
        AND p.broker_id = target_broker_id
        AND COALESCE(p.is_public, false) = true
        AND COALESCE(p.is_active, false) = true
        AND COALESCE(p.status, 'available') IN ('available', 'reserved')
        AND b.is_active = true;
END;
$$;

-- ==========================================
-- 4. GARANTIR DADOS PADRÃO PARA BROKERS
-- ==========================================

-- Atualizar brokers sem configurações de cor
UPDATE brokers 
SET 
    primary_color = COALESCE(primary_color, '#3B82F6'),
    secondary_color = COALESCE(secondary_color, '#1F2937')
WHERE primary_color IS NULL OR secondary_color IS NULL;

-- ==========================================
-- 5. ÍNDICES PARA PERFORMANCE
-- ==========================================

-- Índices para consultas do site público
CREATE INDEX IF NOT EXISTS idx_properties_public_active 
ON properties (broker_id, is_public, is_active, status) 
WHERE is_public = true AND is_active = true;

CREATE INDEX IF NOT EXISTS idx_properties_slug_broker 
ON properties (slug, broker_id) 
WHERE is_public = true AND is_active = true;

CREATE INDEX IF NOT EXISTS idx_property_categories_broker_order 
ON property_categories (broker_id, display_order, name);

CREATE INDEX IF NOT EXISTS idx_property_category_assignments_property 
ON property_category_assignments (property_id, category_id);

-- ==========================================
-- 6. VERIFICAÇÃO DE DADOS ÓRFÃOS
-- ==========================================

-- Verificar propriedades sem broker ativo
SELECT 
    'Propriedades com broker inativo' as issue,
    COUNT(p.*) as count
FROM properties p
LEFT JOIN brokers b ON b.id = p.broker_id
WHERE b.is_active = false OR b.id IS NULL;

-- Verificar categorias órfãs
SELECT 
    'Categorias sem propriedades' as issue,
    COUNT(pc.*) as count
FROM property_categories pc
LEFT JOIN property_category_assignments pca ON pca.category_id = pc.id
WHERE pca.category_id IS NULL;

-- Verificar propriedades sem categoria
SELECT 
    'Propriedades sem categoria' as issue,
    COUNT(p.*) as count
FROM properties p
LEFT JOIN property_category_assignments pca ON pca.property_id = p.id
WHERE pca.property_id IS NULL
AND p.is_public = true 
AND p.is_active = true;

-- ==========================================
-- 7. CORREÇÃO AUTOMÁTICA DE PROBLEMAS
-- ==========================================

-- Atribuir categoria padrão para propriedades sem categoria
INSERT INTO property_category_assignments (property_id, category_id)
SELECT 
    p.id,
    (
        SELECT pc.id 
        FROM property_categories pc 
        WHERE pc.broker_id = p.broker_id 
        LIMIT 1
    )
FROM properties p
LEFT JOIN property_category_assignments pca ON pca.property_id = p.id
WHERE pca.property_id IS NULL
AND p.is_public = true 
AND p.is_active = true
AND EXISTS (
    SELECT 1 FROM property_categories pc 
    WHERE pc.broker_id = p.broker_id
);

-- Criar categoria padrão para brokers que não têm nenhuma
INSERT INTO property_categories (broker_id, name, color, icon, display_order)
SELECT DISTINCT 
    b.id,
    'Geral',
    '#3B82F6',
    'Home',
    1
FROM brokers b
WHERE b.is_active = true
AND NOT EXISTS (
    SELECT 1 FROM property_categories pc 
    WHERE pc.broker_id = b.id
);

-- ==========================================
-- 8. RELATÓRIO FINAL
-- ==========================================

SELECT '=== RELATÓRIO DE CORREÇÕES ===' as status;

-- Estatísticas por broker
SELECT 
    b.name as broker_name,
    b.slug as broker_slug,
    COUNT(p.id) as total_properties,
    COUNT(CASE WHEN p.is_public = true AND p.is_active = true THEN 1 END) as public_properties,
    COUNT(CASE WHEN p.neighborhood IS NOT NULL AND p.neighborhood != '' THEN 1 END) as properties_with_neighborhood,
    COUNT(CASE WHEN p.views_count > 0 THEN 1 END) as properties_with_views
FROM brokers b
LEFT JOIN properties p ON p.broker_id = b.id
WHERE b.is_active = true
GROUP BY b.id, b.name, b.slug
ORDER BY b.name;

-- Verificação final de consistência
SELECT 
    'Propriedades públicas sem bairro' as check_type,
    COUNT(*) as count
FROM properties 
WHERE is_public = true 
AND is_active = true 
AND (neighborhood IS NULL OR neighborhood = '')
UNION ALL
SELECT 
    'Propriedades públicas sem views_count' as check_type,
    COUNT(*) as count
FROM properties 
WHERE is_public = true 
AND is_active = true 
AND views_count IS NULL
UNION ALL
SELECT 
    'Propriedades públicas sem configuração de exibição' as check_type,
    COUNT(*) as count
FROM properties 
WHERE is_public = true 
AND is_active = true 
AND (show_views_count IS NULL OR show_neighborhood IS NULL);

SELECT '=== AUDITORIA COMPLETA FINALIZADA ===' as final_status;