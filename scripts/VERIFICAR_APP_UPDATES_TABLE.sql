-- ================================================
-- VERIFICAR TABELA APP_UPDATES
-- ================================================

-- 1. Verificar se a tabela existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'app_updates'
) AS table_exists;

-- 2. Verificar estrutura da tabela
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'app_updates'
ORDER BY ordinal_position;

-- 3. Verificar políticas RLS
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
WHERE tablename = 'app_updates';

-- 4. Verificar se RLS está habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'app_updates';

-- 5. Testar INSERT manual (rode depois de ver os resultados acima)
-- DESCOMENTE APENAS SE QUISER TESTAR:
/*
INSERT INTO app_updates (
  title,
  content,
  update_type,
  is_published,
  created_by
) VALUES (
  'Teste Manual SQL',
  'Conteúdo de teste',
  'feature',
  false,
  (SELECT id FROM auth.users LIMIT 1) -- Pega primeiro usuário
);
*/

-- 6. Ver últimos registros
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
