-- =====================================================
-- ANÁLISE: Campos Duplicados no Sistema de Imóveis
-- =====================================================
-- Data: 2025-11-18
-- Problema: Informações aparecem duplicadas na interface
-- =====================================================

-- 1. ÁREA
-- Campo principal: area_m2 (aparece no topo com ícone)
-- Campo duplicado: total_area_m2 (aparece em "Áreas & Medidas")
-- 
-- Verificar uso atual:
SELECT 
  COUNT(*) as total_properties,
  COUNT(area_m2) as tem_area_m2,
  COUNT(total_area_m2) as tem_total_area_m2,
  COUNT(CASE WHEN area_m2 IS NOT NULL AND total_area_m2 IS NOT NULL THEN 1 END) as tem_ambos,
  COUNT(CASE WHEN area_m2 != total_area_m2 THEN 1 END) as valores_diferentes
FROM properties;

-- Exemplos de divergências:
SELECT id, property_code, area_m2, total_area_m2, private_area_m2
FROM properties
WHERE area_m2 IS NOT NULL 
  AND total_area_m2 IS NOT NULL 
  AND area_m2 != total_area_m2
LIMIT 10;

-- 2. VAGAS
-- Campo principal: parking_spaces (aparece no topo com ícone)
-- Campo duplicado: covered_parking_spaces (aparece em "Áreas & Medidas")
--
-- Verificar uso atual:
SELECT 
  COUNT(*) as total_properties,
  COUNT(parking_spaces) as tem_parking_spaces,
  COUNT(covered_parking_spaces) as tem_covered_parking_spaces,
  COUNT(CASE WHEN parking_spaces IS NOT NULL AND covered_parking_spaces IS NOT NULL THEN 1 END) as tem_ambos,
  COUNT(CASE WHEN parking_spaces != covered_parking_spaces THEN 1 END) as valores_diferentes
FROM properties;

-- Exemplos de divergências:
SELECT id, property_code, parking_spaces, covered_parking_spaces
FROM properties
WHERE parking_spaces IS NOT NULL 
  AND covered_parking_spaces IS NOT NULL 
  AND parking_spaces != covered_parking_spaces
LIMIT 10;

-- =====================================================
-- RECOMENDAÇÃO:
-- =====================================================
-- OPÇÃO 1: Manter apenas campos principais
--   - Remover: total_area_m2, covered_parking_spaces
--   - Manter: area_m2, parking_spaces, private_area_m2
--
-- OPÇÃO 2: Consolidar dados antes de remover
--   - Se total_area_m2 > area_m2, usar total_area_m2
--   - Se covered_parking_spaces > 0, somar com parking_spaces
--
-- OPÇÃO 3 (RECOMENDADA): Manter campos mas ocultar na interface
--   - Não mostrar total_area_m2 e covered_parking_spaces no site
--   - Manter no banco para dados históricos
--   - Já implementado no frontend (PropertyDetails.tsx)
-- =====================================================

-- =====================================================
-- CASO QUEIRA REMOVER OS CAMPOS DO BANCO (NÃO RECOMENDADO):
-- =====================================================
-- ATENÇÃO: Faça backup antes!
-- 
-- ALTER TABLE properties DROP COLUMN IF EXISTS total_area_m2;
-- ALTER TABLE properties DROP COLUMN IF EXISTS covered_parking_spaces;
-- 
-- OU mesclar dados primeiro:
-- UPDATE properties 
-- SET area_m2 = GREATEST(COALESCE(area_m2, 0), COALESCE(total_area_m2, 0))
-- WHERE total_area_m2 IS NOT NULL AND total_area_m2 > COALESCE(area_m2, 0);
--
-- UPDATE properties 
-- SET parking_spaces = COALESCE(parking_spaces, 0) + COALESCE(covered_parking_spaces, 0)
-- WHERE covered_parking_spaces IS NOT NULL;
-- =====================================================
