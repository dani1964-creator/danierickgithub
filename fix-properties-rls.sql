-- Fix properties RLS policies to ensure proper tenant isolation

-- ❌ REMOVER política pública problemática que permite acesso total
DROP POLICY IF EXISTS "Anyone can view active properties" ON public.properties;

-- ✅ CRIAR política pública APENAS para usuários anônimos (site público)
CREATE POLICY "Anonymous can view active properties"
ON public.properties
FOR SELECT
TO anon
USING (is_active = true);

-- ✅ MANTER políticas específicas para usuários autenticados (já existem)
-- As políticas "Brokers can view their own properties" já estão ativas e corretas

-- ✅ VERIFICAR se RLS está habilitado
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;