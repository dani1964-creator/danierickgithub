-- Script para atualizar o subdomínio de 'danierick' para 'rfimobiliaria'
-- Execute este script no SQL Editor do Supabase Dashboard

-- 1. Verificar o broker atual com subdomain 'danierick'
SELECT 
  id, 
  business_name, 
  website_slug, 
  subdomain,
  custom_domain,
  is_active,
  created_at
FROM public.brokers 
WHERE subdomain = 'danierick' OR website_slug = 'danierick';

-- 2. Atualizar para 'rfimobiliaria' (ajuste o WHERE conforme o ID retornado acima)
-- IMPORTANTE: Verifique o ID antes de executar!

UPDATE public.brokers
SET 
  website_slug = 'rfimobiliaria',
  subdomain = 'rfimobiliaria',
  updated_at = NOW()
WHERE subdomain = 'danierick' OR website_slug = 'danierick';

-- 3. Verificar se a atualização funcionou
SELECT 
  id, 
  business_name, 
  website_slug, 
  subdomain,
  custom_domain,
  is_active,
  updated_at
FROM public.brokers 
WHERE subdomain = 'rfimobiliaria' OR website_slug = 'rfimobiliaria';

-- 4. (Opcional) Se quiser manter histórico, apenas adicione comentário:
COMMENT ON COLUMN public.brokers.subdomain IS 'Subdomínio para acesso (ex: rfimobiliaria)';
