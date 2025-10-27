-- ========================================
-- SCRIPT COMPLETO PARA CONFIGURAR BROKERS
-- ========================================

-- 1. CRIAR BROKER DANIERICK
-- ========================================

-- Inserir usuário (se não existir)
INSERT INTO auth.users (
    id, 
    email, 
    email_confirmed_at, 
    created_at, 
    updated_at, 
    raw_user_meta_data,
    instance_id,
    aud,
    role
) 
SELECT 
    '550e8400-e29b-41d4-a716-446655440001',
    'danierick@adminimobiliaria.site',
    now(),
    now(), 
    now(),
    '{"nome": "Danierick Admin", "email": "danierick@adminimobiliaria.site"}',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated'
WHERE NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'danierick@adminimobiliaria.site'
);

-- Inserir broker danierick
INSERT INTO brokers (
    id,
    user_id,
    business_name,
    website_slug,
    email,
    phone,
    address,
    city,
    uf,
    cep,
    primary_color,
    secondary_color,
    is_active,
    subscription_status,
    subscription_tier,
    site_title,
    site_description,
    subdomain,
    canonical_prefer_custom_domain,
    created_at,
    updated_at
) 
SELECT 
    '550e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440001',
    'Danierick Imobiliária',
    'danierick',
    'danierick@adminimobiliaria.site',
    '(11) 99999-7777',
    'Av. Principal, 1000 - Sala 101',
    'São Paulo',
    'SP',
    '01310-100',
    '#1e40af', -- Azul
    '#64748b', -- Cinza
    true,
    'active',
    'pro',
    'Danierick Imobiliária - Seu Imóvel Ideal',
    'Encontre o imóvel perfeito com a Danierick Imobiliária. Especialistas em vendas e locações em São Paulo.',
    'danierick', -- Subdomínio
    false, -- Não prefere domínio personalizado por enquanto
    now(),
    now()
WHERE NOT EXISTS (
    SELECT 1 FROM brokers WHERE website_slug = 'danierick'
);

-- Inserir domínios do broker
INSERT INTO broker_domains (broker_id, domain, is_active)
SELECT 
    '550e8400-e29b-41d4-a716-446655440002',
    domain_name,
    true
FROM (VALUES 
    ('danierick.adminimobiliaria.site'),
    ('adminimobiliaria.site')  -- Domínio principal também pode acessar via /danierick
) AS domains(domain_name)
WHERE NOT EXISTS (
    SELECT 1 FROM broker_domains 
    WHERE broker_id = '550e8400-e29b-41d4-a716-446655440002' 
    AND domain = domains.domain_name
);

-- ========================================
-- 2. CRIAR PROPRIEDADES DE EXEMPLO
-- ========================================

INSERT INTO properties (
    id,
    broker_id,
    title,
    description,
    price,
    property_type,
    transaction_type,
    address,
    neighborhood,
    city,
    uf,
    bedrooms,
    bathrooms,
    area_m2,
    parking_spaces,
    is_featured,
    is_active,
    main_image_url,
    images,
    features,
    status,
    slug,
    property_code,
    created_at,
    updated_at
) VALUES 
-- Propriedade 1: Casa Moderna
(
    '550e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440002', -- broker danierick
    'Casa Moderna Vila Madalena',
    'Linda casa reformada na Vila Madalena, com acabamentos de primeira qualidade. Próxima ao metrô, comércio e vida noturna da região. Perfeita para quem busca conforto e localização privilegiada.',
    850000,
    'Casa',
    'Venda',
    'Rua Harmonia, 445',
    'Vila Madalena',
    'São Paulo',
    'SP',
    3,
    2,
    120,
    2,
    true, -- featured
    true, -- active
    'https://images.unsplash.com/photo-1570129477492-45c003edd2be?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80',
    '["https://images.unsplash.com/photo-1570129477492-45c003edd2be?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80", "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80", "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80"]',
    '["Churrasqueira", "Quintal", "Próximo ao metrô", "Área gourmet", "Armários planejados"]',
    'available',
    'casa-moderna-vila-madalena',
    'DAN001',
    now(),
    now()
),
-- Propriedade 2: Apartamento Centro
(
    '550e8400-e29b-41d4-a716-446655440004',
    '550e8400-e29b-41d4-a716-446655440002',
    'Apartamento Centro Histórico',
    'Apartamento completamente renovado no coração da cidade. Vista incrível, próximo a transporte público, restaurantes e pontos turísticos. Ideal para executivos ou investidores.',
    520000,
    'Apartamento',
    'Venda',
    'Rua São Bento, 123, Apto 45',
    'Centro',
    'São Paulo',
    'SP',
    2,
    1,
    65,
    0,
    true,
    true,
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80',
    '["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80", "https://images.unsplash.com/photo-1493663284031-b7e3aaa4cab7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80"]',
    '["Vista panorâmica", "Reformado", "Localização privilegiada", "Transporte público"]',
    'available',
    'apartamento-centro-historico',
    'DAN002',
    now(),
    now()
),
-- Propriedade 3: Casa para Locação
(
    '550e8400-e29b-41d4-a716-446655440005',
    '550e8400-e29b-41d4-a716-446655440002',
    'Casa Familiar Jardins',
    'Ampla casa familiar em condomínio fechado nos Jardins. Área de lazer completa, segurança 24h, próxima às melhores escolas da região. Perfeita para famílias que buscam qualidade de vida.',
    4500, -- Aluguel mensal
    'Casa',
    'Locação',
    'Rua dos Jardins, 567',
    'Jardins',
    'São Paulo',
    'SP',
    4,
    3,
    180,
    2,
    true,
    true,
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80',
    '["https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80", "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80"]',
    '["Condomínio fechado", "Área de lazer", "Segurança 24h", "Piscina", "Playground", "Próximo a escolas"]',
    'available',
    'casa-familiar-jardins',
    'DAN003',
    now(),
    now()
);

-- ========================================
-- 3. CRIAR BROKER ADICIONAL DE TESTE
-- ========================================

-- Usuário para segundo broker
INSERT INTO auth.users (
    id, 
    email, 
    email_confirmed_at, 
    created_at, 
    updated_at, 
    raw_user_meta_data,
    instance_id,
    aud,
    role
) 
SELECT 
    '550e8400-e29b-41d4-a716-446655440006',
    'teste@adminimobiliaria.site',
    now(),
    now(), 
    now(),
    '{"nome": "Admin Teste", "email": "teste@adminimobiliaria.site"}',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated'
WHERE NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'teste@adminimobiliaria.site'
);

-- Segundo broker para testes
INSERT INTO brokers (
    id,
    user_id,
    business_name,
    website_slug,
    email,
    phone,
    address,
    city,
    uf,
    cep,
    primary_color,
    secondary_color,
    is_active,
    subscription_status,
    subscription_tier,
    site_title,
    site_description,
    subdomain,
    created_at,
    updated_at
) 
SELECT 
    '550e8400-e29b-41d4-a716-446655440007',
    '550e8400-e29b-41d4-a716-446655440006',
    'Imobiliária Teste',
    'imobiliaria-teste',
    'teste@adminimobiliaria.site',
    '(11) 98888-7777',
    'Rua de Teste, 100',
    'São Paulo',
    'SP',
    '01234-567',
    '#dc2626', -- Vermelho
    '#374151', -- Cinza escuro
    true,
    'active',
    'basic',
    'Imobiliária Teste - Encontre Seu Lar',
    'Sua imobiliária de confiança para encontrar o lar dos seus sonhos.',
    'teste',
    now(),
    now()
WHERE NOT EXISTS (
    SELECT 1 FROM brokers WHERE website_slug = 'imobiliaria-teste'
);

-- ========================================
-- 4. VERIFICAÇÕES E RELATÓRIOS
-- ========================================

-- Verificar brokers criados
SELECT 
    'BROKERS CRIADOS' as tipo,
    b.business_name,
    b.website_slug,
    b.email,
    b.subdomain,
    CASE WHEN b.is_active THEN 'Ativo' ELSE 'Inativo' END as status
FROM brokers b
WHERE b.website_slug IN ('danierick', 'imobiliaria-teste');

-- Verificar domínios configurados
SELECT 
    'DOMÍNIOS CONFIGURADOS' as tipo,
    bd.domain,
    b.business_name as broker,
    CASE WHEN bd.is_active THEN 'Ativo' ELSE 'Inativo' END as status
FROM broker_domains bd
JOIN brokers b ON b.id = bd.broker_id
WHERE b.website_slug IN ('danierick', 'imobiliaria-teste');

-- Verificar propriedades criadas
SELECT 
    'PROPRIEDADES CRIADAS' as tipo,
    p.title,
    p.property_type,
    p.transaction_type,
    p.price,
    b.business_name as broker
FROM properties p
JOIN brokers b ON b.id = p.broker_id
WHERE b.website_slug IN ('danierick', 'imobiliaria-teste');

-- ========================================
-- 5. URLS PARA TESTE
-- ========================================

/*
APÓS EXECUTAR ESTE SCRIPT, VOCÊ PODE TESTAR:

🌐 DOMÍNIO PRINCIPAL (SLUG):
- https://adminimobiliaria.site/danierick
- https://adminimobiliaria.site/imobiliaria-teste

🌐 SUBDOMÍNIOS:
- https://danierick.adminimobiliaria.site
- https://teste.adminimobiliaria.site

📊 DASHBOARD ADMIN:
- https://adminimobiliaria.site/dashboard
- https://adminimobiliaria.site/admin
- https://adminimobiliaria.site/super-admin

🔍 DEBUG:
- https://adminimobiliaria.site/debug/danierick
- http://localhost:3001/debug/danierick

🏠 PROPRIEDADES ESPECÍFICAS:
- https://adminimobiliaria.site/danierick/casa-moderna-vila-madalena
- https://danierick.adminimobiliaria.site/casa-moderna-vila-madalena

📱 PÁGINAS INSTITUCIONAIS:
- https://adminimobiliaria.site/danierick/sobre-nos
- https://adminimobiliaria.site/danierick/politica-de-privacidade
- https://adminimobiliaria.site/danierick/termos-de-uso
*/