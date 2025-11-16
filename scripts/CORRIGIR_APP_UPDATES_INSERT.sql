-- ================================================
-- DIAGNÓSTICO E CORREÇÃO - APP_UPDATES INSERT
-- ================================================

-- ===========================================
-- PASSO 1: DIAGNÓSTICO
-- ===========================================

-- 1.1 Verificar se a tabela existe
SELECT '=== 1. TABELA EXISTE? ===' AS check_step;
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'app_updates'
) AS table_exists;

-- 1.2 Verificar estrutura (especialmente created_by)
SELECT '=== 2. ESTRUTURA DA TABELA ===' AS check_step;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'app_updates'
ORDER BY ordinal_position;

-- 1.3 Verificar RLS habilitado
SELECT '=== 3. RLS HABILITADO? ===' AS check_step;
SELECT 
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE tablename = 'app_updates';

-- 1.4 Listar políticas RLS existentes
SELECT '=== 4. POLÍTICAS RLS EXISTENTES ===' AS check_step;
SELECT 
  policyname,
  cmd AS operation,
  roles,
  qual AS using_expression,
  with_check
FROM pg_policies
WHERE tablename = 'app_updates'
ORDER BY cmd, policyname;

-- 1.5 Verificar se você é super admin
SELECT '=== 5. VOCÊ É SUPER ADMIN? ===' AS check_step;
SELECT 
  id,
  business_name,
  is_super_admin,
  user_id
FROM public.brokers
WHERE user_id = auth.uid();

-- ===========================================
-- PASSO 2: CORREÇÃO DAS POLÍTICAS RLS
-- ===========================================

-- 2.1 Remover políticas antigas (se existirem)
DROP POLICY IF EXISTS "Admin can do everything on app_updates" ON public.app_updates;
DROP POLICY IF EXISTS "Brokers can view published updates" ON public.app_updates;

-- 2.2 Criar política para SUPER ADMIN fazer tudo
CREATE POLICY "Super admin full access to app_updates"
  ON public.app_updates
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.brokers
      WHERE brokers.user_id = auth.uid()
      AND brokers.is_super_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.brokers
      WHERE brokers.user_id = auth.uid()
      AND brokers.is_super_admin = true
    )
  );

-- 2.3 Criar política para CORRETORES lerem apenas publicadas
CREATE POLICY "Authenticated brokers can view published updates"
  ON public.app_updates
  FOR SELECT
  TO authenticated
  USING (
    is_published = true
    AND EXISTS (
      SELECT 1 FROM public.brokers
      WHERE brokers.user_id = auth.uid()
    )
  );

-- 2.4 Permitir SERVICE ROLE fazer INSERT (para API routes)
CREATE POLICY "Service role can insert updates"
  ON public.app_updates
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update updates"
  ON public.app_updates
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can delete updates"
  ON public.app_updates
  FOR DELETE
  TO service_role
  USING (true);

-- ===========================================
-- PASSO 3: VERIFICAÇÃO FINAL
-- ===========================================

SELECT '=== 6. POLÍTICAS APLICADAS ===' AS check_step;
SELECT 
  policyname,
  cmd AS operation,
  roles
FROM pg_policies
WHERE tablename = 'app_updates'
ORDER BY cmd, policyname;

-- ===========================================
-- PASSO 4: TESTE MANUAL (OPCIONAL)
-- ===========================================

-- Descomente para testar INSERT manualmente:
/*
INSERT INTO app_updates (
  title,
  content,
  update_type,
  is_published,
  created_by
) VALUES (
  'Teste de Correção',
  'Se este registro aparecer, o INSERT está funcionando!',
  'feature',
  false,
  auth.uid() -- Seu user_id
) RETURNING id, title, created_at;
*/

-- Ver últimos registros criados
SELECT '=== 7. ÚLTIMOS REGISTROS ===' AS check_step;
SELECT 
  id,
  title,
  update_type,
  is_published,
  created_by,
  created_at
FROM app_updates
ORDER BY created_at DESC
LIMIT 5;

SELECT '=== ✅ SCRIPT COMPLETO ===' AS final_message;
SELECT 'Execute agora o teste no frontend (Nova Atualização)' AS next_step;
