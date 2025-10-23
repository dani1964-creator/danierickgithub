-- 🔧 SCRIPT PARA REMOVER CONSTRAINTS DUPLICADOS
-- Execute estes comandos UM POR VEZ no Supabase SQL Editor

-- 1. Remover constraints com nomes antigos/incorretos
DROP CONSTRAINT IF EXISTS unique_custom_domain ON brokers;
DROP CONSTRAINT IF EXISTS unique_website_slug ON brokers; 
DROP CONSTRAINT IF EXISTS brokers_subdomain_key ON brokers;

-- 2. Garantir que os constraints corretos existem
DO $$
BEGIN
    -- Custom domain constraint
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'brokers_custom_domain_unique') THEN
        ALTER TABLE brokers ADD CONSTRAINT brokers_custom_domain_unique UNIQUE (custom_domain);
    END IF;
    
    -- Website slug constraint  
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'brokers_website_slug_unique') THEN
        ALTER TABLE brokers ADD CONSTRAINT brokers_website_slug_unique UNIQUE (website_slug);
    END IF;
    
    -- Subdomain constraint
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'brokers_subdomain_unique') THEN
        ALTER TABLE brokers ADD CONSTRAINT brokers_subdomain_unique UNIQUE (subdomain);
    END IF;
END $$;

-- 3. Verificar resultado final
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'brokers'::regclass
AND contype = 'u'  -- unique constraints only
ORDER BY conname;