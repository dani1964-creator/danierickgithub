-- Script para verificar se os campos de cores customizadas existem no banco de dados
-- Execute no Supabase SQL Editor para verificar

-- 1. Verificar se as colunas existem na tabela brokers
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'brokers'
  AND column_name IN ('detail_header_text_color', 'detail_button_color', 'search_button_color')
ORDER BY column_name;

-- 2. Verificar valores atuais (apenas para o broker logado)
SELECT 
  id,
  business_name,
  detail_header_text_color,
  detail_button_color,
  search_button_color,
  primary_color,
  secondary_color
FROM brokers
WHERE user_id = auth.uid()
LIMIT 1;

-- Se as colunas NÃO aparecerem no resultado da primeira query,
-- execute a migration abaixo:

/*
ALTER TABLE brokers
ADD COLUMN IF NOT EXISTS detail_header_text_color TEXT,
ADD COLUMN IF NOT EXISTS detail_button_color TEXT,
ADD COLUMN IF NOT EXISTS search_button_color TEXT;
*/
