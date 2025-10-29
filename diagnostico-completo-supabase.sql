-- ========================================
-- DIAGNÓSTICO COMPLETO MULTI-TENANCY
-- Execute no SQL Editor do Supabase
-- ========================================

-- 1. VERIFICAR ESTRUTURA DAS TABELAS PRINCIPAIS
SELECT 
    'ESTRUTURA TABELAS' as categoria,
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as total_colunas
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_name IN ('brokers', 'properties', 'leads', 'realtors', 'social_links')
ORDER BY table_name;

-- 2. VERIFICAR COLUNAS DE ISOLAMENTO MULTI-TENANCY
SELECT 
    'CAMPOS ISOLAMENTO' as categoria,
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public'
AND table_name IN ('brokers', 'properties', 'leads', 'realtors', 'social_links')
AND column_name IN ('broker_id', 'user_id', 'realtor_id')
ORDER BY table_name, column_name;

-- 3. VERIFICAR FOREIGN KEYS (RELACIONAMENTOS)
SELECT 
    'FOREIGN KEYS' as categoria,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name IN ('brokers', 'properties', 'leads', 'realtors', 'social_links')
ORDER BY tc.table_name, kcu.column_name;

-- 4. VERIFICAR RLS HABILITADO
SELECT 
    'RLS STATUS' as categoria,
    tablename,
    rowsecurity as rls_habilitado
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('brokers', 'properties', 'leads', 'realtors', 'social_links')
ORDER BY tablename;

-- 5. VERIFICAR POLÍTICAS RLS
SELECT 
    'RLS POLICIES' as categoria,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as operacao
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('brokers', 'properties', 'leads', 'realtors', 'social_links')
ORDER BY tablename, cmd, policyname;

-- 6. CONTAR DADOS POR TABELA
SELECT 'CONTAGEM DADOS - BROKERS' as categoria, COUNT(*) as total FROM brokers;
SELECT 'CONTAGEM DADOS - PROPERTIES' as categoria, COUNT(*) as total FROM properties;
SELECT 'CONTAGEM DADOS - LEADS' as categoria, COUNT(*) as total FROM leads;
SELECT 'CONTAGEM DADOS - REALTORS' as categoria, COUNT(*) as total FROM realtors;

-- 7. VERIFICAR RELACIONAMENTO PROPERTIES -> BROKERS (problema do SuperAdmin)
SELECT 
    'PROPRIEDADES POR BROKER' as categoria,
    b.business_name,
    b.email,
    b.is_active as broker_ativo,
    COUNT(p.id) as total_propriedades
FROM brokers b
LEFT JOIN properties p ON p.broker_id = b.id
GROUP BY b.id, b.business_name, b.email, b.is_active
ORDER BY b.business_name;

-- 8. VERIFICAR SE CAMPO properties_count EXISTE EM BROKERS
SELECT 
    'CAMPO PROPERTIES_COUNT' as categoria,
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public'
AND table_name = 'brokers'
AND column_name = 'properties_count';

-- 9. VERIFICAR FUNÇÕES RELACIONADAS
SELECT 
    'FUNÇÕES SISTEMA' as categoria,
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND (routine_name LIKE '%broker%' OR routine_name LIKE '%propert%')
ORDER BY routine_name;

-- 10. VERIFICAR INTEGRIDADE REFERENCIAL
SELECT 
    'INTEGRIDADE - PROPERTIES SEM BROKER' as categoria,
    COUNT(*) as total_orphans
FROM properties p
LEFT JOIN brokers b ON p.broker_id = b.id
WHERE b.id IS NULL;

SELECT 
    'INTEGRIDADE - LEADS SEM BROKER' as categoria,
    COUNT(*) as total_orphans
FROM leads l
LEFT JOIN brokers b ON l.broker_id = b.id
WHERE b.id IS NULL;

-- 11. VERIFICAR ISOLAMENTO MULTI-TENANCY
SELECT 
    'ISOLAMENTO MULTI-TENANCY' as categoria,
    'BROKERS ÚNICOS' as item,
    COUNT(DISTINCT b.id) as total_tenants
FROM brokers b;

-- 12. VERIFICAR DADOS DE TESTE
SELECT 
    'DADOS TESTE' as categoria,
    'BROKERS' as tabela,
    business_name,
    email,
    is_active,
    created_at
FROM brokers
ORDER BY created_at DESC
LIMIT 10;

-- 13. VERIFICAR SUPER ADMIN
SELECT 
    'SUPER ADMIN' as categoria,
    business_name,
    email,
    is_active
FROM brokers 
WHERE email = 'erickjq123@gmail.com' OR business_name = 'Super Admin';