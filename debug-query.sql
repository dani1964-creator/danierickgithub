-- Debug query to check brokers and properties
SELECT 
  b.business_name,
  b.website_slug as broker_slug,
  p.title,
  p.slug as property_slug,
  p.is_active
FROM brokers b
LEFT JOIN properties p ON p.broker_id = b.id
WHERE b.is_active = true
ORDER BY b.business_name, p.title
LIMIT 10;

-- Check if RPC functions exist
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%public_property%'
OR routine_name LIKE '%public_broker%';