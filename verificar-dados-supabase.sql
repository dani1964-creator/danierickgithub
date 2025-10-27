-- ========================================
-- VERIFICAÇÃO COMPLETA DOS DADOS NO SUPABASE
-- ========================================

-- 1. VERIFICAR TODAS AS IMOBILIÁRIAS
SELECT 
  id,
  user_id,
  business_name,
  display_name,
  email,
  website_slug,
  phone,
  whatsapp_number,
  contact_email,
  is_active,
  plan_type,
  max_properties,
  created_at,
  updated_at
FROM brokers 
ORDER BY created_at DESC;

-- 2. CONTAR TOTAL DE IMOBILIÁRIAS
SELECT COUNT(*) as total_brokers FROM brokers;

-- 3. VERIFICAR QUAIS SÃO SUPER ADMIN
SELECT 
  business_name,
  email,
  is_active,
  CASE 
    WHEN email = 'erickjq123@gmail.com' THEN 'SUPER ADMIN'
    WHEN business_name = 'Super Admin' THEN 'SUPER ADMIN'
    ELSE 'IMOBILIÁRIA'
  END as tipo
FROM brokers 
ORDER BY created_at DESC;

-- 4. VERIFICAR USUÁRIOS NO AUTH (apenas via dashboard do Supabase)
-- SELECT * FROM auth.users ORDER BY created_at DESC;

-- 5. VERIFICAR PROPRIEDADES POR IMOBILIÁRIA
SELECT 
  b.business_name,
  b.email,
  COUNT(p.id) as total_properties
FROM brokers b
LEFT JOIN properties p ON p.broker_id = b.id
GROUP BY b.id, b.business_name, b.email
ORDER BY b.created_at DESC;

-- 6. VERIFICAR CORRETORES POR IMOBILIÁRIA
SELECT 
  b.business_name as imobiliaria,
  b.email as email_imobiliaria,
  r.name as corretor_nome,
  r.email as corretor_email,
  r.phone as corretor_telefone
FROM brokers b
LEFT JOIN realtors r ON r.broker_id = b.id
ORDER BY b.business_name, r.name;

-- 7. VERIFICAR RLS POLICIES
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('brokers', 'properties', 'realtors')
ORDER BY tablename, policyname;

-- 8. VERIFICAR TRIGGERS E FUNCTIONS
SELECT 
  schemaname,
  tablename,
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table IN ('brokers', 'properties', 'realtors');