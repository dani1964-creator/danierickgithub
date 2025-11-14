-- Script para verificar e criar super admin se necessário
-- Execute no SQL Editor do Supabase

-- 1. Verificar se existe algum super admin
SELECT id, business_name, email, is_super_admin, user_id
FROM brokers
WHERE is_super_admin = true;

-- Se não retornar nenhum resultado, execute o comando abaixo
-- substituindo o email pelo seu email real usado no sistema

-- 2. Tornar um broker específico super admin (SUBSTITUA O EMAIL)
UPDATE brokers
SET is_super_admin = true
WHERE email = 'SEU_EMAIL_AQUI@gmail.com';  -- ← SUBSTITUA AQUI

-- 3. Verificar se funcionou
SELECT id, business_name, email, is_super_admin, user_id
FROM brokers
WHERE is_super_admin = true;

-- 4. Se ainda assim não funcionar, liste todos os brokers
SELECT id, business_name, email, is_super_admin, user_id
FROM brokers
LIMIT 10;
