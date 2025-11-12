-- Script para verificar e criar broker "rfimobiliaria" no Supabase
-- Execute este script no SQL Editor do Supabase Dashboard

-- 1. Verificar se o broker já existe
SELECT 
  id, 
  business_name, 
  website_slug, 
  custom_domain,
  subdomain,
  is_active
FROM public.brokers 
WHERE website_slug = 'rfimobiliaria' 
   OR subdomain = 'rfimobiliaria'
   OR custom_domain = 'rfimobiliaria.adminimobiliaria.site';

-- 2. Se não existir, criar o broker (ajuste os valores conforme necessário)
-- IMPORTANTE: Execute apenas se a query acima retornar vazio

/*
INSERT INTO public.brokers (
  business_name,
  display_name,
  website_slug,
  subdomain,
  email,
  is_active,
  primary_color,
  secondary_color,
  site_title,
  site_description
) VALUES (
  'R&F Imobiliária',           -- Nome do negócio
  'R&F Imobiliária',           -- Nome de exibição
  'rfimobiliaria',             -- Slug para URL
  'rfimobiliaria',             -- Subdomínio
  'contato@rfimobiliaria.com', -- Email de contato
  true,                        -- Ativo
  '#1e40af',                   -- Cor primária (azul)
  '#f59e0b',                   -- Cor secundária (laranja)
  'R&F Imobiliária',           -- Título do site
  'Encontre o lar dos seus sonhos' -- Descrição
)
RETURNING id, business_name, website_slug;
*/

-- 3. Verificar todos os brokers existentes
SELECT 
  id, 
  business_name, 
  website_slug, 
  subdomain,
  custom_domain,
  is_active,
  created_at
FROM public.brokers 
ORDER BY created_at DESC
LIMIT 10;
