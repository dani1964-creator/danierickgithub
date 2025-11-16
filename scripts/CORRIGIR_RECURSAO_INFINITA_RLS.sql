-- ================================================
-- CORREÇÃO: RECURSÃO INFINITA NAS POLÍTICAS RLS
-- ================================================
-- Erro: "infinite recursion detected in policy for relation 'brokers'"
-- Causa: Políticas RLS que fazem SELECT em brokers dentro de USING()
-- ================================================

-- ===========================================
-- PASSO 1: DIAGNÓSTICO
-- ===========================================

SELECT '=== 1. POLÍTICAS RLS DE BROKERS ===' AS check_step;
SELECT 
  policyname,
  cmd AS operation,
  roles,
  SUBSTRING(qual::text, 1, 100) AS using_expression_preview
FROM pg_policies
WHERE tablename = 'brokers'
ORDER BY cmd, policyname;

-- ===========================================
-- PASSO 2: REMOVER POLÍTICAS PROBLEMÁTICAS DE BROKERS
-- ===========================================

DROP POLICY IF EXISTS "Brokers podem ver seus próprios dados" ON public.brokers;
DROP POLICY IF EXISTS "Admin pode ver todos os brokers" ON public.brokers;
DROP POLICY IF EXISTS "Super admin can view all brokers" ON public.brokers;
DROP POLICY IF EXISTS "Brokers can view their own data" ON public.brokers;
DROP POLICY IF EXISTS "Service role pode criar brokers" ON public.brokers;
DROP POLICY IF EXISTS "Brokers podem atualizar seus dados" ON public.brokers;
DROP POLICY IF EXISTS "Brokers can update their own data" ON public.brokers;
DROP POLICY IF EXISTS "Super admin pode atualizar qualquer broker" ON public.brokers;
DROP POLICY IF EXISTS "Super admin can update any broker" ON public.brokers;
DROP POLICY IF EXISTS "Admin pode deletar brokers" ON public.brokers;
DROP POLICY IF EXISTS "Super admin can delete brokers" ON public.brokers;
DROP POLICY IF EXISTS "Public can insert brokers" ON public.brokers;
DROP POLICY IF EXISTS "Service role can insert brokers" ON public.brokers;

-- ===========================================
-- PASSO 3: CRIAR POLÍTICAS CORRETAS PARA BROKERS
-- ===========================================

-- 3.1 SERVICE ROLE - Acesso total (para API routes)
CREATE POLICY "service_role_brokers_all"
  ON public.brokers
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 3.2 AUTHENTICATED - SELECT (ver próprio broker)
-- ⚠️ NÃO usar subquery em brokers aqui (causa recursão)
CREATE POLICY "authenticated_brokers_select_own"
  ON public.brokers
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 3.3 AUTHENTICATED - UPDATE (atualizar próprio broker)
CREATE POLICY "authenticated_brokers_update_own"
  ON public.brokers
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 3.4 PUBLIC - INSERT (para registro via /cadastro)
CREATE POLICY "public_brokers_insert"
  ON public.brokers
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- ===========================================
-- PASSO 4: CORRIGIR POLÍTICAS DE APP_UPDATES
-- ===========================================

DROP POLICY IF EXISTS "Admin can do everything on app_updates" ON public.app_updates;
DROP POLICY IF EXISTS "Brokers can view published updates" ON public.app_updates;
DROP POLICY IF EXISTS "Super admin full access to app_updates" ON public.app_updates;
DROP POLICY IF EXISTS "Authenticated brokers can view published updates" ON public.app_updates;
DROP POLICY IF EXISTS "Service role can insert updates" ON public.app_updates;
DROP POLICY IF EXISTS "Service role can update updates" ON public.app_updates;
DROP POLICY IF EXISTS "Service role can delete updates" ON public.app_updates;

-- Service role - acesso total
CREATE POLICY "service_role_app_updates_all"
  ON public.app_updates
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Super admin - acesso total
CREATE POLICY "super_admin_app_updates_all"
  ON public.app_updates
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.brokers WHERE is_super_admin = true
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.brokers WHERE is_super_admin = true
    )
  );

-- Brokers autenticados - ver apenas publicadas (ou se for super admin ver todas)
CREATE POLICY "authenticated_app_updates_select"
  ON public.app_updates
  FOR SELECT
  TO authenticated
  USING (
    is_published = true
    OR auth.uid() IN (
      SELECT user_id FROM public.brokers WHERE is_super_admin = true
    )
  );

-- ===========================================
-- PASSO 5: CORRIGIR IMPROVEMENT_SUGGESTIONS
-- ===========================================

DROP POLICY IF EXISTS "Admin can view all suggestions" ON public.improvement_suggestions;
DROP POLICY IF EXISTS "Brokers can view own suggestions" ON public.improvement_suggestions;
DROP POLICY IF EXISTS "Brokers can view all suggestions" ON public.improvement_suggestions;
DROP POLICY IF EXISTS "Brokers can create suggestions" ON public.improvement_suggestions;
DROP POLICY IF EXISTS "Admin can update suggestions" ON public.improvement_suggestions;
DROP POLICY IF EXISTS "Brokers can update own pending suggestions" ON public.improvement_suggestions;

-- Service role - acesso total
CREATE POLICY "service_role_suggestions_all"
  ON public.improvement_suggestions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Super admin - ver e modificar todas
CREATE POLICY "super_admin_suggestions_all"
  ON public.improvement_suggestions
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.brokers WHERE is_super_admin = true
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.brokers WHERE is_super_admin = true
    )
  );

-- Brokers - ver todas sugestões
CREATE POLICY "authenticated_suggestions_select"
  ON public.improvement_suggestions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.brokers WHERE user_id = auth.uid()
    )
  );

-- Brokers - criar sugestões
CREATE POLICY "authenticated_suggestions_insert"
  ON public.improvement_suggestions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    broker_id IN (
      SELECT id FROM public.brokers WHERE user_id = auth.uid()
    )
  );

-- Brokers - atualizar apenas suas sugestões pendentes
CREATE POLICY "authenticated_suggestions_update_own"
  ON public.improvement_suggestions
  FOR UPDATE
  TO authenticated
  USING (
    broker_id IN (
      SELECT id FROM public.brokers WHERE user_id = auth.uid()
    )
    AND status = 'pending'
  )
  WITH CHECK (
    broker_id IN (
      SELECT id FROM public.brokers WHERE user_id = auth.uid()
    )
  );

-- ===========================================
-- PASSO 6: VERIFICAÇÃO FINAL
-- ===========================================

SELECT '=== 2. POLÍTICAS BROKERS ATUALIZADAS ===' AS check_step;
SELECT 
  policyname,
  cmd AS operation,
  roles
FROM pg_policies
WHERE tablename = 'brokers'
ORDER BY roles, cmd;

SELECT '=== 3. POLÍTICAS APP_UPDATES ATUALIZADAS ===' AS check_step;
SELECT 
  policyname,
  cmd AS operation,
  roles
FROM pg_policies
WHERE tablename = 'app_updates'
ORDER BY roles, cmd;

SELECT '=== 4. POLÍTICAS SUGGESTIONS ATUALIZADAS ===' AS check_step;
SELECT 
  policyname,
  cmd AS operation,
  roles
FROM pg_policies
WHERE tablename = 'improvement_suggestions'
ORDER BY roles, cmd;

-- ===========================================
-- PASSO 7: TESTE RÁPIDO
-- ===========================================

SELECT '=== 5. TESTE: VOCÊ É SUPER ADMIN? ===' AS check_step;
SELECT 
  id,
  business_name,
  is_super_admin,
  user_id
FROM public.brokers
WHERE user_id = auth.uid();

-- Se is_super_admin = false, execute:
/*
UPDATE public.brokers
SET is_super_admin = true
WHERE user_id = auth.uid();
*/

SELECT '=== ✅ CORREÇÃO COMPLETA ===' AS final_message;
SELECT 'Recarregue a página /admin e teste criar uma atualização' AS next_step;
