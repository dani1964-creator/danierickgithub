-- ========================================
-- SCRIPT PARA RECRIAR IMOBILIÁRIAS NO SUPABASE
-- Execute APENAS se as imobiliárias não existirem
-- ========================================

-- IMPORTANTE: Antes de executar, verifique se os user_ids existem no auth.users
-- Substitua os UUIDs pelos user_ids corretos do seu Supabase Auth

-- 1. RECRIAR IMOBILIÁRIA: imobi teste
INSERT INTO brokers (
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
) VALUES (
  gen_random_uuid(),
  '2702b6c1-316f-4054-a476-a2a7aaabf8e9', -- SUBSTITUA pelo user_id correto
  'imobi teste',
  'dsads',
  'bucosistyle@hotmail.com',
  'bucos',
  null,
  null,
  'bucosistyle@hotmail.com',
  true,
  'basic',
  100,
  '2025-09-10 17:08:50+00',
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- 2. RECRIAR IMOBILIÁRIA: terceira imob
INSERT INTO brokers (
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
) VALUES (
  gen_random_uuid(),
  '3f116469-3ba6-4229-899c-f131a523c7b4', -- SUBSTITUA pelo user_id correto
  'terceira imob',
  'felfelf',
  'erickjq11@gmail.com',
  'home',
  null,
  null,
  'erickjq11@gmail.com',
  true,
  'basic',
  100,
  '2025-09-09 05:00:47+00',
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- 3. RECRIAR IMOBILIÁRIA: Imobiliária Soares
INSERT INTO brokers (
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
) VALUES (
  gen_random_uuid(),
  '7c697947-a93a-47e4-ac47-20650c5bf17e', -- SUBSTITUA pelo user_id correto
  'Imobiliária Soares',
  'Felts',
  'erickp2032@gmail.com',
  'deps',
  null,
  null,
  'erickp2032@gmail.com',
  true,
  'basic',
  100,
  '2025-09-09 00:31:49+00',
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- 4. RECRIAR IMOBILIÁRIA: AugustusEmperor
INSERT INTO brokers (
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
) VALUES (
  gen_random_uuid(),
  '22f83fed-43af-45eb-acb7-7b70301d2639', -- SUBSTITUA pelo user_id correto
  'AugustusEmperor',
  'Augustus',
  'pedrodesousakiske@gmail.com',
  'augustus',
  null,
  null,
  'pedrodesousakiske@gmail.com',
  true,
  'basic',
  100,
  '2025-08-21 16:55:27+00',
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- 5. VERIFICAR SE R&F IMOBILIÁRIA EXISTE (deve estar já criada)
SELECT id, business_name, email FROM brokers 
WHERE business_name ILIKE '%r%f%' OR email = 'danierick.erick@hotmail.com';

-- 6. CRIAR ALGUNS CORRETORES DE TESTE PARA R&F (Alexandre e Kelly)
INSERT INTO realtors (
  id,
  broker_id,
  name,
  email,
  phone,
  whatsapp_number,
  creci_number,
  bio,
  photo_url,
  is_active,
  created_at,
  updated_at
) 
SELECT 
  gen_random_uuid(),
  b.id,
  'Alexandre Ferreira',
  'alexandre@rf-imobiliaria.com.br',
  '(11) 99999-1111',
  '5511999991111',
  'CRECI-123456',
  'Corretor especializado em imóveis residenciais',
  null,
  true,
  NOW(),
  NOW()
FROM brokers b 
WHERE b.email = 'danierick.erick@hotmail.com'
AND NOT EXISTS (
  SELECT 1 FROM realtors r 
  WHERE r.broker_id = b.id 
  AND r.name = 'Alexandre Ferreira'
);

INSERT INTO realtors (
  id,
  broker_id,
  name,
  email,
  phone,
  whatsapp_number,
  creci_number,
  bio,
  photo_url,
  is_active,
  created_at,
  updated_at
) 
SELECT 
  gen_random_uuid(),
  b.id,
  'Kelly Santos',
  'kelly@rf-imobiliaria.com.br',
  '(11) 99999-2222',
  '5511999992222',
  'CRECI-654321',
  'Corretora especializada em imóveis comerciais',
  null,
  true,
  NOW(),
  NOW()
FROM brokers b 
WHERE b.email = 'danierick.erick@hotmail.com'
AND NOT EXISTS (
  SELECT 1 FROM realtors r 
  WHERE r.broker_id = b.id 
  AND r.name = 'Kelly Santos'
);

-- 7. VERIFICAR SE AS INSERÇÕES FUNCIONARAM
SELECT 
  'RESUMO FINAL' as status,
  COUNT(*) as total_brokers,
  COUNT(CASE WHEN email != 'erickjq123@gmail.com' THEN 1 END) as imobiliarias_reais,
  COUNT(CASE WHEN email = 'erickjq123@gmail.com' THEN 1 END) as super_admins
FROM brokers;