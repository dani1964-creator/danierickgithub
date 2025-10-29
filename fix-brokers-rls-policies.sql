-- =============================================================================
-- DIAGNÓSTICO E CORREÇÃO DE POLÍTICAS RLS PARA TABELA BROKERS
-- =============================================================================
-- Execute este SQL no Supabase SQL Editor para diagnosticar e corrigir
-- problemas de acesso à tabela brokers no SuperAdmin

-- 1. VERIFICAR POLÍTICAS ATUAIS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'brokers';

-- 2. VERIFICAR SE RLS ESTÁ HABILITADA
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'brokers';

-- 3. REMOVER POLÍTICAS EXISTENTES (se houver conflitos)
DROP POLICY IF EXISTS "Brokers can view own data" ON brokers;
DROP POLICY IF EXISTS "Brokers can update own data" ON brokers;
DROP POLICY IF EXISTS "Enable read access for all users" ON brokers;
DROP POLICY IF EXISTS "Public read access for brokers" ON brokers;
DROP POLICY IF EXISTS "brokers_select_policy" ON brokers;
DROP POLICY IF EXISTS "brokers_insert_policy" ON brokers;
DROP POLICY IF EXISTS "brokers_update_policy" ON brokers;
DROP POLICY IF EXISTS "brokers_delete_policy" ON brokers;

-- 4. CRIAR POLÍTICAS CORRETAS PARA SUPERADMIN

-- Política para leitura pública (necessária para SuperAdmin funcionar)
CREATE POLICY "Enable read access for all authenticated users" ON "public"."brokers"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (true);

-- Política para leitura por usuários anônimos (caso SuperAdmin use anon key)
CREATE POLICY "Enable read access for anonymous users" ON "public"."brokers"
AS PERMISSIVE FOR SELECT
TO anon
USING (true);

-- Política para proprietários editarem seus próprios dados
CREATE POLICY "Brokers can update own data" ON "public"."brokers"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Política para inserção (signup de novos brokers)
CREATE POLICY "Enable insert for authenticated users" ON "public"."brokers"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Política para SuperAdmin poder fazer tudo (se usando service role)
CREATE POLICY "Enable all access for service role" ON "public"."brokers"
AS PERMISSIVE FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 5. GARANTIR QUE RLS ESTÁ HABILITADA
ALTER TABLE "public"."brokers" ENABLE ROW LEVEL SECURITY;

-- 6. TESTAR ACESSO
-- Execute esta consulta para verificar se está funcionando:
-- SELECT COUNT(*) FROM brokers;

-- 7. VERIFICAR NOVAMENTE AS POLÍTICAS CRIADAS
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'brokers'
ORDER BY policyname;