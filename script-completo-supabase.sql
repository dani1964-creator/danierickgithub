-- ========================================
-- SCRIPT COMPLETO PARA CORREÇÃO DO SUPABASE
-- Execute no SQL Editor do Supabase Dashboard
-- ========================================

-- 🔍 PARTE 1: VERIFICAÇÃO DOS DADOS ATUAIS
-- ========================================

-- 1. Verificar quantos brokers existem
SELECT 
    'TOTAL BROKERS' as tipo,
    COUNT(*) as quantidade
FROM brokers
UNION ALL
SELECT 
    'SUPER ADMINS' as tipo,
    COUNT(*) as quantidade
FROM brokers 
WHERE email = 'erickjq123@gmail.com' OR business_name = 'Super Admin'
UNION ALL
SELECT 
    'IMOBILIÁRIAS REAIS' as tipo,
    COUNT(*) as quantidade
FROM brokers 
WHERE email != 'erickjq123@gmail.com' AND business_name != 'Super Admin';

-- 2. Listar todas as imobiliárias atuais
SELECT 
    ROW_NUMBER() OVER (ORDER BY created_at DESC) as num,
    business_name,
    email,
    is_active,
    CASE 
        WHEN email = 'erickjq123@gmail.com' THEN '🔧 SUPER ADMIN'
        WHEN business_name = 'Super Admin' THEN '🔧 SUPER ADMIN'
        ELSE '🏢 IMOBILIÁRIA'
    END as tipo,
    created_at
FROM brokers 
ORDER BY created_at DESC;

-- 🛠️ PARTE 2: RECRIAR IMOBILIÁRIAS SE NÃO EXISTIREM
-- ========================================

-- Verificar quais emails NÃO existem ainda
SELECT 'EMAILS FALTANDO' as status;

SELECT 
    email_esperado,
    CASE 
        WHEN EXISTS (SELECT 1 FROM brokers WHERE email = email_esperado) 
        THEN '✅ EXISTE' 
        ELSE '❌ NÃO EXISTE - PRECISA CRIAR' 
    END as status
FROM (
    VALUES 
        ('bucosistyle@hotmail.com'),
        ('erickjq11@gmail.com'),
        ('erickp2032@gmail.com'),
        ('pedrodesousakiske@gmail.com'),
        ('danierick.erick@hotmail.com')
) AS t(email_esperado);

-- 🆕 PARTE 3: INSERIR IMOBILIÁRIAS FALTANDO
-- ========================================
-- ATENÇÃO: Só execute se você confirmar que elas não existem acima!

-- A. Criar imobi teste (se não existir)
INSERT INTO brokers (
    id,
    user_id,
    business_name,
    display_name,
    email,
    website_slug,
    contact_email,
    is_active,
    plan_type,
    max_properties,
    created_at,
    updated_at
) 
SELECT 
    gen_random_uuid(),
    gen_random_uuid(), -- Gerará um UUID temporário - você pode ajustar depois
    'imobi teste',
    'Teste Imobiliária',
    'bucosistyle@hotmail.com',
    'imobi-teste',
    'bucosistyle@hotmail.com',
    true,
    'basic',
    100,
    '2025-09-10 17:08:50+00'::timestamptz,
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM brokers WHERE email = 'bucosistyle@hotmail.com'
);

-- B. Criar terceira imob (se não existir)  
INSERT INTO brokers (
    id,
    user_id,
    business_name,
    display_name,
    email,
    website_slug,
    contact_email,
    is_active,
    plan_type,
    max_properties,
    created_at,
    updated_at
) 
SELECT 
    gen_random_uuid(),
    gen_random_uuid(),
    'terceira imob',
    'Terceira Imobiliária',
    'erickjq11@gmail.com',
    'terceira-imob',
    'erickjq11@gmail.com',
    true,
    'basic',
    100,
    '2025-09-09 05:00:47+00'::timestamptz,
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM brokers WHERE email = 'erickjq11@gmail.com'
);

-- C. Criar Imobiliária Soares (se não existir)
INSERT INTO brokers (
    id,
    user_id,
    business_name,
    display_name,
    email,
    website_slug,
    contact_email,
    is_active,
    plan_type,
    max_properties,
    created_at,
    updated_at
) 
SELECT 
    gen_random_uuid(),
    gen_random_uuid(),
    'Imobiliária Soares',
    'Soares & Associados',
    'erickp2032@gmail.com',
    'soares-imoveis',
    'erickp2032@gmail.com',
    true,
    'basic',
    100,
    '2025-09-09 00:31:49+00'::timestamptz,
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM brokers WHERE email = 'erickp2032@gmail.com'
);

-- D. Criar AugustusEmperor (se não existir)
INSERT INTO brokers (
    id,
    user_id,
    business_name,
    display_name,
    email,
    website_slug,
    contact_email,
    is_active,
    plan_type,
    max_properties,
    created_at,
    updated_at
) 
SELECT 
    gen_random_uuid(),
    gen_random_uuid(),
    'AugustusEmperor',
    'Augustus Imóveis',
    'pedrodesousakiske@gmail.com',
    'augustus-imoveis',
    'pedrodesousakiske@gmail.com',
    true,
    'basic',
    100,
    '2025-08-21 16:55:27+00'::timestamptz,
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM brokers WHERE email = 'pedrodesousakiske@gmail.com'
);

-- E. Garantir que R&F Imobiliária existe
INSERT INTO brokers (
    id,
    user_id,
    business_name,
    display_name,
    email,
    website_slug,
    contact_email,
    is_active,
    plan_type,
    max_properties,
    created_at,
    updated_at
) 
SELECT 
    gen_random_uuid(),
    gen_random_uuid(),
    'R&F imobiliaria',
    'Alexandre Ferreira',
    'danierick.erick@hotmail.com',
    'danierick',
    'danierick.erick@hotmail.com',
    true,
    'basic',
    100,
    '2025-08-13 00:09:28+00'::timestamptz,
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM brokers WHERE email = 'danierick.erick@hotmail.com'
);

-- 👨‍💼 PARTE 4: CRIAR CORRETORES PARA R&F
-- ========================================

-- Buscar o ID da R&F para inserir corretores
DO $$
DECLARE
    rf_broker_id UUID;
BEGIN
    -- Encontrar o ID da R&F
    SELECT id INTO rf_broker_id 
    FROM brokers 
    WHERE email = 'danierick.erick@hotmail.com'
    LIMIT 1;
    
    IF rf_broker_id IS NOT NULL THEN
        -- Inserir Alexandre (se não existir)
        INSERT INTO realtors (
            id,
            broker_id,
            name,
            email,
            phone,
            whatsapp_number,
            creci_number,
            bio,
            is_active,
            created_at,
            updated_at
        ) 
        SELECT 
            gen_random_uuid(),
            rf_broker_id,
            'Alexandre Ferreira',
            'alexandre@rf-imobiliaria.com',
            '(11) 99999-1111',
            '5511999991111',
            'CRECI-123456-SP',
            'Corretor especializado em imóveis residenciais e comerciais',
            true,
            NOW(),
            NOW()
        WHERE NOT EXISTS (
            SELECT 1 FROM realtors 
            WHERE broker_id = rf_broker_id 
            AND name = 'Alexandre Ferreira'
        );
        
        -- Inserir Kelly (se não existir)
        INSERT INTO realtors (
            id,
            broker_id,
            name,
            email,
            phone,
            whatsapp_number,
            creci_number,
            bio,
            is_active,
            created_at,
            updated_at
        ) 
        SELECT 
            gen_random_uuid(),
            rf_broker_id,
            'Kelly Santos',
            'kelly@rf-imobiliaria.com',
            '(11) 99999-2222',
            '5511999992222',
            'CRECI-654321-SP',
            'Corretora especializada em apartamentos e casas de alto padrão',
            true,
            NOW(),
            NOW()
        WHERE NOT EXISTS (
            SELECT 1 FROM realtors 
            WHERE broker_id = rf_broker_id 
            AND name = 'Kelly Santos'
        );
        
        RAISE NOTICE 'Corretores criados para R&F Imobiliária (ID: %)', rf_broker_id;
    ELSE
        RAISE NOTICE 'R&F Imobiliária não encontrada!';
    END IF;
END $$;

-- 🔍 PARTE 5: VERIFICAÇÃO FINAL
-- ========================================

-- Verificar resultado final
SELECT 
    'RESUMO FINAL' as status,
    COUNT(*) as total_brokers,
    COUNT(CASE 
        WHEN email != 'erickjq123@gmail.com' 
        AND business_name != 'Super Admin' 
        THEN 1 
    END) as imobiliarias_reais,
    COUNT(CASE 
        WHEN email = 'erickjq123@gmail.com' 
        OR business_name = 'Super Admin' 
        THEN 1 
    END) as super_admins
FROM brokers;

-- Listar todas as imobiliárias finais
SELECT 
    ROW_NUMBER() OVER (ORDER BY 
        CASE WHEN email = 'erickjq123@gmail.com' THEN 0 ELSE 1 END,
        created_at DESC
    ) as num,
    business_name,
    email,
    is_active,
    CASE 
        WHEN email = 'erickjq123@gmail.com' THEN '🔧 SUPER ADMIN'
        WHEN business_name = 'Super Admin' THEN '🔧 SUPER ADMIN'
        ELSE '🏢 IMOBILIÁRIA'
    END as tipo
FROM brokers 
ORDER BY 
    CASE WHEN email = 'erickjq123@gmail.com' THEN 0 ELSE 1 END,
    created_at DESC;

-- Verificar corretores da R&F
SELECT 
    'CORRETORES DA R&F' as info,
    r.name,
    r.email,
    r.phone,
    r.creci_number,
    r.is_active
FROM realtors r
JOIN brokers b ON b.id = r.broker_id
WHERE b.email = 'danierick.erick@hotmail.com'
ORDER BY r.name;