-- Fix brokers RLS policies to allow public access to essential data

-- ✅ CRIAR política pública para usuários anônimos acessarem dados básicos dos brokers
-- Sites públicos precisam acessar: nome, logo, cores, SEO, etc.
CREATE POLICY "Anonymous can view active broker public data"
ON public.brokers
FOR SELECT
TO anon
USING (is_active = true);

-- ✅ VERIFICAR se RLS está habilitado para brokers
ALTER TABLE public.brokers ENABLE ROW LEVEL SECURITY;

-- ✅ Política similar para broker_domains (necessária para resolução de domínios customizados)
CREATE POLICY "Anonymous can view active broker domains"
ON public.broker_domains
FOR SELECT
TO anon
USING (is_active = true);