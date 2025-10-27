-- Script para criar usuário Super Admin no banco de dados
-- Email: erickjq123@gmail.com
-- Senha: Danis0133.

-- Primeiro, vamos inserir o usuário na tabela auth.users do Supabase
-- Nota: Este script deve ser executado no painel do Supabase ou via API

-- 1. Criar usuário de autenticação (simulando signup)
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  role,
  aud,
  confirmation_token,
  email_change_token_new,
  recovery_token
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'erickjq123@gmail.com',
  crypt('Danis0133.', gen_salt('bf')), -- Hash da senha usando bcrypt
  now(),
  now(),
  now(),
  'authenticated',
  'authenticated',
  '',
  '',
  ''
) ON CONFLICT (email) DO UPDATE SET
  encrypted_password = crypt('Danis0133.', gen_salt('bf')),
  updated_at = now();

-- 2. Criar perfil de broker para o usuário admin
-- Primeiro precisamos pegar o ID do usuário criado
WITH admin_user AS (
  SELECT id FROM auth.users WHERE email = 'erickjq123@gmail.com'
)
INSERT INTO public.brokers (
  id,
  user_id,
  email,
  business_name,
  display_name,
  website_slug,
  phone,
  whatsapp_number,
  contact_email,
  is_active,
  plan_type,
  max_properties,
  created_at,
  updated_at
) 
SELECT 
  gen_random_uuid(),
  admin_user.id,
  'erickjq123@gmail.com',
  'Super Admin',
  'Administrador do Sistema',
  'admin',
  '+55 11 99999-9999',
  '+55 11 99999-9999',
  'erickjq123@gmail.com',
  true,
  'enterprise',
  999999,
  now(),
  now()
FROM admin_user
ON CONFLICT (email) DO UPDATE SET
  business_name = 'Super Admin',
  display_name = 'Administrador do Sistema',
  updated_at = now();

-- 3. Verificar se o usuário foi criado corretamente
SELECT 
  u.email,
  u.email_confirmed_at,
  b.business_name,
  b.display_name,
  b.is_active
FROM auth.users u
LEFT JOIN public.brokers b ON u.id = b.user_id
WHERE u.email = 'erickjq123@gmail.com';