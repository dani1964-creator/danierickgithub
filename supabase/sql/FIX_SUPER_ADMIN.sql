-- Script para configurar Super Admin
-- Execute no SQL Editor do Supabase

-- 1. Verificar se existe algum super admin
SELECT id, business_name, email, is_super_admin, user_id
FROM brokers
WHERE is_super_admin = true;

-- 2. Tornar erickjq123@gmail.com super admin
UPDATE brokers
SET is_super_admin = true
WHERE email = 'erickjq123@gmail.com';

-- 3. Verificar se funcionou
SELECT id, business_name, email, is_super_admin, user_id
FROM brokers
WHERE email = 'erickjq123@gmail.com';

-- 4. Confirmar que agora é super admin
SELECT id, business_name, email, is_super_admin, user_id
FROM brokers
WHERE is_super_admin = true;
