-- Verificar dados das imobiliárias
SELECT 
  id,
  user_id,
  business_name,
  email,
  display_name,
  website_slug,
  is_active,
  created_at
FROM brokers 
ORDER BY created_at DESC;