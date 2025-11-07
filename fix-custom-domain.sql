-- Execute este SQL no Supabase Dashboard → SQL Editor

-- Verificar valor atual
SELECT id, website_slug, custom_domain 
FROM brokers 
WHERE id = '1e7b21c7-1727-4741-8b89-dcddc406ce06';

-- Limpar custom_domain
UPDATE brokers 
SET custom_domain = NULL 
WHERE id = '1e7b21c7-1727-4741-8b89-dcddc406ce06';

-- Verificar se foi atualizado
SELECT id, website_slug, custom_domain 
FROM brokers 
WHERE id = '1e7b21c7-1727-4741-8b89-dcddc406ce06';
