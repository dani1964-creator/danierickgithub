-- Script para corrigir email da R&F Imobiliária
-- IMPORTANTE: Execute este script apenas após confirmar qual imobiliária precisa ser corrigida

-- 1. Verificar imobiliárias atuais
SELECT 
  id,
  business_name,
  email,
  user_id,
  display_name,
  is_active
FROM brokers 
WHERE business_name ILIKE '%r%f%' OR business_name ILIKE '%rf%'
ORDER BY created_at DESC;

-- 2. Verificar usuário auth do danierick
-- (Isso precisa ser executado via service role ou dashboard do Supabase)

-- 3. Atualizar email da R&F (DESCOMENTE APENAS APÓS CONFIRMAR O ID)
-- UPDATE brokers 
-- SET 
--   email = 'danierick.erick@hotmail.com',
--   updated_at = NOW()
-- WHERE business_name ILIKE '%r%f%' 
--   AND email != 'danierick.erick@hotmail.com';

-- 4. Verificar se a correção funcionou
-- SELECT 
--   id,
--   business_name,
--   email,
--   user_id,
--   updated_at
-- FROM brokers 
-- WHERE business_name ILIKE '%r%f%';