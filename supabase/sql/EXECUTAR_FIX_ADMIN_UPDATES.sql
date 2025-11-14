-- ============================================================================
-- SOLUÇÃO COMPLETA: Corrigir erro ao salvar atualização em /admin/updates
-- Copie e cole TUDO no SQL Editor do Supabase e execute
-- ============================================================================

-- PASSO 1: Tornar created_by NULLABLE (permite criar sem user_id)
ALTER TABLE app_updates 
ALTER COLUMN created_by DROP NOT NULL;

-- PASSO 2: Configurar erickjq123@gmail.com como super admin
UPDATE brokers
SET is_super_admin = true,
    user_id = COALESCE(
      user_id,
      (SELECT id FROM auth.users WHERE email = 'erickjq123@gmail.com' LIMIT 1)
    )
WHERE email = 'erickjq123@gmail.com';

-- PASSO 3: Verificar se funcionou
SELECT 
  id,
  business_name,
  email,
  is_super_admin,
  user_id,
  CASE 
    WHEN user_id IS NOT NULL THEN '✅ OK - Pode criar atualizações agora!'
    ELSE '⚠️ AÇÃO NECESSÁRIA - Leia instruções abaixo'
  END as status
FROM brokers
WHERE email = 'erickjq123@gmail.com';

-- ============================================================================
-- SE APARECER "AÇÃO NECESSÁRIA" NO RESULTADO ACIMA:
--
-- 1. Vá em: Supabase Dashboard > Authentication > Users
-- 2. Clique em: "Create User"
-- 3. Preencha:
--    - Email: erickjq123@gmail.com
--    - Senha: Danis0133.
-- 4. Execute TODO este SQL novamente
--
-- DEPOIS: Teste criar uma atualização em /admin/updates
-- ============================================================================
