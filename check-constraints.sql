-- Verificar todos os constraints da tabela brokers
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'brokers'::regclass
ORDER BY conname;

-- Verificar especificamente os constraints mencionados
SELECT 
    conname,
    CASE 
        WHEN conname IN ('unique_custom_domain', 'brokers_custom_domain_unique') THEN 'DUPLICATE: custom_domain'
        WHEN conname IN ('unique_website_slug', 'brokers_website_slug_unique') THEN 'DUPLICATE: website_slug'  
        WHEN conname IN ('brokers_subdomain_key', 'brokers_subdomain_unique') THEN 'DUPLICATE: subdomain'
        ELSE 'OK'
    END as status
FROM pg_constraint 
WHERE conrelid = 'brokers'::regclass
AND conname IN (
    'unique_custom_domain', 'brokers_custom_domain_unique',
    'unique_website_slug', 'brokers_website_slug_unique',
    'brokers_subdomain_key', 'brokers_subdomain_unique'
)
ORDER BY constraint_name;
