-- ============================================================================
-- SUPER DIAGNÓSTICO: Sistema de Atualizações
-- Execute cada seção separadamente e anote os resultados
-- ============================================================================

-- ============================================================================
-- SEÇÃO 1: VERIFICAR ESTRUTURA DA TABELA app_updates
-- ============================================================================
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  CASE 
    WHEN is_nullable = 'YES' THEN '✅ NULLABLE'
    ELSE '❌ NOT NULL'
  END as status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'app_updates'
ORDER BY ordinal_position;

-- ============================================================================
-- SEÇÃO 2: VERIFICAR SE EXISTE BROKER erickjq123@gmail.com
-- ============================================================================
SELECT 
  'BROKER erickjq123@gmail.com' as tipo,
  id,
  business_name,
  email,
  is_super_admin,
  user_id,
  is_active,
  created_at
FROM brokers
WHERE email = 'erickjq123@gmail.com';

-- RESULTADO ESPERADO: 
-- Se retornar VAZIO = Não existe broker com esse email (PROBLEMA!)
-- Se retornar com dados = Existe

-- ============================================================================
-- SEÇÃO 3: LISTAR TODOS OS BROKERS COM is_super_admin = true
-- ============================================================================
SELECT 
  'TODOS SUPER ADMINS' as tipo,
  id,
  business_name,
  email,
  is_super_admin,
  user_id,
  CASE 
    WHEN user_id IS NOT NULL THEN '✅ TEM USER_ID'
    ELSE '❌ SEM USER_ID'
  END as status
FROM brokers
WHERE is_super_admin = true;

-- ============================================================================
-- SEÇÃO 4: VERIFICAR SE EXISTE USER erickjq123@gmail.com em auth.users
-- ============================================================================
SELECT 
  'AUTH USER' as tipo,
  id,
  email,
  created_at,
  last_sign_in_at,
  CASE 
    WHEN last_sign_in_at IS NOT NULL THEN '✅ JÁ FEZ LOGIN'
    ELSE '⚠️ NUNCA FEZ LOGIN'
  END as status
FROM auth.users
WHERE email = 'erickjq123@gmail.com';

-- RESULTADO ESPERADO:
-- Se retornar VAZIO = Usuário não existe no auth.users (CRIAR!)
-- Se retornar com dados = Usuário existe

-- ============================================================================
-- SEÇÃO 5: VERIFICAR POLÍTICAS RLS DA TABELA app_updates
-- ============================================================================
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

-- ============================================================================
-- SEÇÃO 6: LISTAR TODAS AS ATUALIZAÇÕES EXISTENTES
-- ============================================================================
SELECT 
  id,
  title,
  update_type,
  is_published,
  created_by,
  created_at,
  CASE 
    WHEN created_by IS NULL THEN '⚠️ SEM CREATED_BY'
    ELSE '✅ TEM CREATED_BY'
  END as status
FROM app_updates
ORDER BY created_at DESC
LIMIT 10;

-- ============================================================================
-- SEÇÃO 7: TENTAR INSERIR UMA ATUALIZAÇÃO DE TESTE
-- ============================================================================
-- IMPORTANTE: Anote o erro se falhar!

INSERT INTO app_updates (
  title,
  content,
  update_type,
  is_published
) VALUES (
  'TESTE DIAGNÓSTICO',
  'Esta é uma atualização de teste para diagnóstico',
  'announcement',
  false
)
RETURNING 
  id,
  title,
  created_by,
  CASE 
    WHEN created_by IS NULL THEN '✅ CRIADO SEM CREATED_BY'
    ELSE '✅ CRIADO COM CREATED_BY'
  END as resultado;

-- Se este INSERT falhar, anote o erro completo!
-- Erro comum: "null value in column created_by violates not-null constraint"

-- ============================================================================
-- SEÇÃO 8: LIMPAR TESTE (executar apenas se o INSERT acima funcionou)
-- ============================================================================
DELETE FROM app_updates
WHERE title = 'TESTE DIAGNÓSTICO';

-- ============================================================================
-- RESUMO DOS PROBLEMAS POSSÍVEIS:
-- ============================================================================
-- PROBLEMA 1: erickjq123@gmail.com não existe na tabela brokers
--   SOLUÇÃO: Não criar! Este usuário é super admin puro, não é broker
--
-- PROBLEMA 2: created_by é NOT NULL
--   SOLUÇÃO: Executar ALTER TABLE para tornar NULLABLE
--
-- PROBLEMA 3: RLS bloqueando insert
--   SOLUÇÃO: Ajustar política RLS
--
-- PROBLEMA 4: erickjq123@gmail.com não existe em auth.users
--   SOLUÇÃO: Criar usuário no Authentication do Supabase
-- ============================================================================
