-- ==========================================
-- AUDITORIA COMPLETA - DADOS SITE PÚBLICO
-- ==========================================
-- Script para garantir que TODAS as informações do site público
-- tenham configuração adequada no banco de dados

-- ==========================================
-- 1. VERIFICAR ESTRUTURA ATUAL DAS TABELAS
-- ==========================================

-- Verificar colunas de visibilidade em properties
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'properties' 
  AND column_name IN ('is_active', 'is_public', 'status', 'neighborhood', 'views_count')
ORDER BY column_name;

-- Verificar se existem políticas RLS ativas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename IN ('properties', 'property_categories', 'property_category_assignments', 'property_views')
ORDER BY tablename, policyname;

-- ==========================================
-- 2. ADICIONAR COLUNAS AUSENTES (SE NECESSÁRIO)
-- ==========================================

-- Garantir que a tabela properties tem todas as colunas necessárias
DO $$
BEGIN
    -- Adicionar is_public se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'properties' AND column_name = 'is_public'
    ) THEN
        ALTER TABLE properties ADD COLUMN is_public BOOLEAN DEFAULT true;
    END IF;

    -- Adicionar is_active se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'properties' AND column_name = 'is_active'
    ) THEN
        ALTER TABLE properties ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;

    -- Adicionar views_count se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'properties' AND column_name = 'views_count'
    ) THEN
        ALTER TABLE properties ADD COLUMN views_count INTEGER DEFAULT 0;
    END IF;

    -- Adicionar neighborhood se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'properties' AND column_name = 'neighborhood'
    ) THEN
        ALTER TABLE properties ADD COLUMN neighborhood TEXT;
    END IF;

    -- Adicionar status se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'properties' AND column_name = 'status'
    ) THEN
        ALTER TABLE properties ADD COLUMN status TEXT DEFAULT 'available';
    END IF;

    -- Adicionar show_views_count se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'properties' AND column_name = 'show_views_count'
    ) THEN
        ALTER TABLE properties ADD COLUMN show_views_count BOOLEAN DEFAULT true;
    END IF;

    -- Adicionar show_neighborhood se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'properties' AND column_name = 'show_neighborhood'
    ) THEN
        ALTER TABLE properties ADD COLUMN show_neighborhood BOOLEAN DEFAULT true;
    END IF;

END $$;

-- ==========================================
-- 3. TABELA DE CONTROLE DE VISUALIZAÇÕES
-- ==========================================

-- Criar tabela property_views se não existir
CREATE TABLE IF NOT EXISTS property_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    viewer_ip INET,
    user_agent TEXT,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_property_views_property_id ON property_views(property_id);
CREATE INDEX IF NOT EXISTS idx_property_views_viewed_at ON property_views(viewed_at);

-- ==========================================
-- 4. FUNÇÃO PARA ATUALIZAR CONTADORES
-- ==========================================

-- Função para calcular views_count baseado na tabela property_views
CREATE OR REPLACE FUNCTION update_property_views_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE properties 
    SET views_count = (
        SELECT COUNT(*) 
        FROM property_views 
        WHERE property_id = NEW.property_id
    )
    WHERE id = NEW.property_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para atualizar automaticamente
DROP TRIGGER IF EXISTS trigger_update_views_count ON property_views;
CREATE TRIGGER trigger_update_views_count
    AFTER INSERT ON property_views
    FOR EACH ROW
    EXECUTE FUNCTION update_property_views_count();

-- ==========================================
-- 5. NORMALIZAR DADOS EXISTENTES
-- ==========================================

-- Garantir que todas as propriedades tenham configurações padrão
UPDATE properties 
SET 
    is_public = COALESCE(is_public, true),
    is_active = COALESCE(is_active, true),
    views_count = COALESCE(views_count, 0),
    status = COALESCE(status, 'available'),
    show_views_count = COALESCE(show_views_count, true),
    show_neighborhood = COALESCE(show_neighborhood, true)
WHERE 
    is_public IS NULL 
    OR is_active IS NULL 
    OR views_count IS NULL 
    OR status IS NULL 
    OR show_views_count IS NULL 
    OR show_neighborhood IS NULL;

-- Atualizar views_count baseado em dados existentes (se houver)
UPDATE properties 
SET views_count = (
    SELECT COALESCE(COUNT(*), 0) 
    FROM property_views 
    WHERE property_id = properties.id
)
WHERE EXISTS (SELECT 1 FROM property_views WHERE property_id = properties.id);

-- ==========================================
-- 6. POLÍTICAS RLS PARA SITE PÚBLICO
-- ==========================================

-- Remover políticas antigas que podem estar causando conflito
DROP POLICY IF EXISTS "Public site can view published properties" ON properties;
DROP POLICY IF EXISTS "Public can view active properties" ON properties;
DROP POLICY IF EXISTS "Public access to properties" ON properties;

-- Política DEFINITIVA para acesso público
CREATE POLICY "public_site_access_properties" 
ON properties 
FOR SELECT 
USING (
    is_public = true 
    AND is_active = true 
    AND status IN ('available', 'reserved')
);

-- Política para property_views (permitir inserção pública)
DROP POLICY IF EXISTS "Anyone can insert property views" ON property_views;
CREATE POLICY "public_can_insert_views" 
ON property_views 
FOR INSERT 
WITH CHECK (true);

-- Política para leitura de views (apenas dados agregados)
DROP POLICY IF EXISTS "Public can view property views" ON property_views;
CREATE POLICY "public_can_view_aggregated_views" 
ON property_views 
FOR SELECT 
USING (true);

-- Política para categorias (acesso público)
DROP POLICY IF EXISTS "Public can view categories" ON property_categories;
CREATE POLICY "public_access_categories" 
ON property_categories 
FOR SELECT 
USING (true);

-- Política para associações categoria-imóvel
DROP POLICY IF EXISTS "Public can view property category assignments" ON property_category_assignments;
CREATE POLICY "public_access_property_categories" 
ON property_category_assignments 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM properties p 
        WHERE p.id = property_id 
        AND p.is_public = true 
        AND p.is_active = true
    )
);

-- ==========================================
-- 7. FUNÇÃO RPC ATUALIZADA PARA SITE PÚBLICO
-- ==========================================

-- Função que garante retorno consistente de dados públicos
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
    IF custom_domain_param IS NOT NULL THEN
        SELECT b.id INTO target_broker_id
        FROM brokers b
        WHERE b.custom_domain = custom_domain_param
        AND b.is_active = true;
    ELSIF broker_slug_param IS NOT NULL THEN
        SELECT b.id INTO target_broker_id
        FROM brokers b
        WHERE b.slug = broker_slug_param
        AND b.is_active = true;
    END IF;

    -- Se não encontrou broker, retornar vazio
    IF target_broker_id IS NULL THEN
        RETURN;
    END IF;

    -- Retornar propriedades públicas com TODAS as informações
    RETURN QUERY
    SELECT 
        p.id,
        p.title,
        p.description,
        p.price,
        p.address,
        CASE 
            WHEN p.show_neighborhood = true THEN p.neighborhood
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
            WHEN p.show_views_count = true THEN p.views_count
            ELSE 0
        END as views_count,
        p.show_views_count,
        p.show_neighborhood,
        p.status,
        p.created_at,
        COALESCE(
            (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', pc.id,
                        'name', pc.name,
                        'color', pc.color,
                        'icon', pc.icon
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
        AND p.is_public = true
        AND p.is_active = true
        AND p.status IN ('available', 'reserved')
        AND b.is_active = true
    ORDER BY p.created_at DESC
    LIMIT limit_param
    OFFSET offset_param;
END;
$$;

-- ==========================================
-- 8. FUNÇÃO PARA REGISTRAR VISUALIZAÇÃO
-- ==========================================

CREATE OR REPLACE FUNCTION register_property_view(
    property_slug_param TEXT,
    viewer_ip_param INET DEFAULT NULL,
    user_agent_param TEXT DEFAULT NULL,
    broker_slug_param TEXT DEFAULT NULL,
    custom_domain_param TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    target_property_id UUID;
    target_broker_id UUID;
BEGIN
    -- Determinar broker
    IF custom_domain_param IS NOT NULL THEN
        SELECT b.id INTO target_broker_id
        FROM brokers b
        WHERE b.custom_domain = custom_domain_param
        AND b.is_active = true;
    ELSIF broker_slug_param IS NOT NULL THEN
        SELECT b.id INTO target_broker_id
        FROM brokers b
        WHERE b.slug = broker_slug_param
        AND b.is_active = true;
    END IF;

    -- Encontrar a propriedade
    SELECT p.id INTO target_property_id
    FROM properties p
    WHERE p.slug = property_slug_param
    AND p.broker_id = target_broker_id
    AND p.is_public = true
    AND p.is_active = true;

    IF target_property_id IS NULL THEN
        RETURN false;
    END IF;

    -- Registrar visualização
    INSERT INTO property_views (property_id, viewer_ip, user_agent)
    VALUES (target_property_id, viewer_ip_param, user_agent_param);

    RETURN true;
END;
$$;

-- ==========================================
-- 9. VERIFICAÇÕES FINAIS
-- ==========================================

-- Contar propriedades com problemas de configuração
SELECT 
    'Propriedades sem is_public' as issue,
    COUNT(*) as count
FROM properties 
WHERE is_public IS NULL
UNION ALL
SELECT 
    'Propriedades sem is_active' as issue,
    COUNT(*) as count
FROM properties 
WHERE is_active IS NULL
UNION ALL
SELECT 
    'Propriedades sem views_count' as issue,
    COUNT(*) as count
FROM properties 
WHERE views_count IS NULL
UNION ALL
SELECT 
    'Propriedades sem neighborhood' as issue,
    COUNT(*) as count
FROM properties 
WHERE neighborhood IS NULL OR neighborhood = ''
UNION ALL
SELECT 
    'Propriedades ativas mas não públicas' as issue,
    COUNT(*) as count
FROM properties 
WHERE is_active = true AND is_public = false;

-- Verificar distribuição de status
SELECT 
    status,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM properties), 2) as percentage
FROM properties 
GROUP BY status
ORDER BY count DESC;

-- ==========================================
-- 10. SCRIPT DE CORREÇÃO DE DADOS ÓRFÃOS
-- ==========================================

-- Remover associações de categorias órfãs
DELETE FROM property_category_assignments 
WHERE property_id NOT IN (SELECT id FROM properties);

-- Remover visualizações órfãs
DELETE FROM property_views 
WHERE property_id NOT IN (SELECT id FROM properties);

-- ==========================================
-- RESUMO E RECOMENDAÇÕES
-- ==========================================

SELECT '=== AUDITORIA CONCLUÍDA ===' as status;

-- Estatísticas finais
SELECT 
    'Total de propriedades' as metric,
    COUNT(*) as value
FROM properties
UNION ALL
SELECT 
    'Propriedades públicas e ativas' as metric,
    COUNT(*) as value
FROM properties 
WHERE is_public = true AND is_active = true
UNION ALL
SELECT 
    'Propriedades com visualizações' as metric,
    COUNT(*) as value
FROM properties 
WHERE views_count > 0;

-- Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('properties', 'property_views', 'property_categories', 'property_category_assignments')
ORDER BY tablename;