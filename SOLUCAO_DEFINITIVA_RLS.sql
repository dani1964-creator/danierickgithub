-- ========================================
-- SOLUÇÃO DEFINITIVA PARA SuperAdmin
-- Execute no SQL Editor do Supabase
-- ========================================

-- 1. VERIFICAR PROBLEMA ATUAL
SELECT 
    'STATUS ATUAL' as info,
    tablename,
    rowsecurity as rls_habilitado
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'brokers';

-- 2. VERIFICAR POLÍTICAS EXISTENTES
SELECT 
    'POLÍTICAS ATUAIS' as info,
    policyname,
    cmd as operacao,
    permissive,
    roles
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'brokers';

-- 3. REMOVER TODAS AS POLÍTICAS RESTRITIVAS
DROP POLICY IF EXISTS "SuperAdmin can view all brokers" ON brokers;
DROP POLICY IF EXISTS "SuperAdmin can update all brokers" ON brokers;
DROP POLICY IF EXISTS "SuperAdmin can delete all brokers" ON brokers;
DROP POLICY IF EXISTS "SuperAdmin can insert brokers" ON brokers;
DROP POLICY IF EXISTS "Enable read access for all users" ON brokers;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON brokers;
DROP POLICY IF EXISTS "Enable update for users based on email" ON brokers;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON brokers;

-- 4. CRIAR POLÍTICA ÚNICA E PERMISSIVA PARA LEITURA
CREATE POLICY "Allow public read access to brokers" ON brokers
    FOR SELECT 
    TO anon, authenticated
    USING (true);

-- 5. CRIAR POLÍTICA PARA OPERAÇÕES ADMIN (INSERT/UPDATE/DELETE)
CREATE POLICY "Allow all operations for authenticated users" ON brokers
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 6. GARANTIR QUE RLS ESTÁ HABILITADO
ALTER TABLE brokers ENABLE ROW LEVEL SECURITY;

-- 7. TESTAR SE A SOLUÇÃO FUNCIONOU
SELECT 
    'TESTE FINAL' as info,
    COUNT(*) as total_brokers_visiveis
FROM brokers;

-- 8. VERIFICAR SE AS POLÍTICAS FORAM CRIADAS CORRETAMENTE
SELECT 
    'RESULTADO' as status,
    policyname,
    cmd,
    roles
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'brokers'
ORDER BY policyname;

-- 9. LISTAR TODOS OS BROKERS PARA CONFIRMAÇÃO
SELECT 
    'DADOS FINAIS' as info,
    id,
    business_name,
    email,
    is_active
FROM brokers
ORDER BY business_name;