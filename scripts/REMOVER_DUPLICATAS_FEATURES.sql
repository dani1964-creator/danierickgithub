-- =====================================================
-- SCRIPT: Remover duplicatas de Elevador e Portaria 24h
-- do array features quando já existem como campos boolean
-- =====================================================
-- Data: 2025-11-18
-- Descrição: Remove "Elevador" e "Portaria 24h" do array
-- features[] pois essas informações já existem como
-- campos elevator (boolean) e portaria_24h (boolean)
-- =====================================================

-- BACKUP: Criar tabela de backup antes de modificar
CREATE TABLE IF NOT EXISTS properties_backup_features AS 
SELECT id, features 
FROM properties 
WHERE features IS NOT NULL 
  AND array_length(features, 1) > 0;

-- 1. Remover "Elevador" do array features
UPDATE properties
SET features = array_remove(features, 'Elevador')
WHERE 'Elevador' = ANY(features);

-- 2. Remover "Portaria 24h" do array features (várias variações)
UPDATE properties
SET features = array_remove(features, 'Portaria 24h')
WHERE 'Portaria 24h' = ANY(features);

UPDATE properties
SET features = array_remove(features, 'Portaria')
WHERE 'Portaria' = ANY(features);

-- 3. Remover variações com case insensitive
UPDATE properties
SET features = (
  SELECT array_agg(f)
  FROM unnest(features) AS f
  WHERE LOWER(f) NOT IN ('elevador', 'portaria 24h', 'portaria')
)
WHERE EXISTS (
  SELECT 1 FROM unnest(features) AS f
  WHERE LOWER(f) IN ('elevador', 'portaria 24h', 'portaria')
);

-- 4. Limpar arrays vazios (definir como NULL)
UPDATE properties
SET features = NULL
WHERE features = '{}' OR array_length(features, 1) = 0;

-- VERIFICAÇÃO: Quantos registros foram afetados
SELECT 
  COUNT(*) as total_properties,
  COUNT(CASE WHEN features IS NOT NULL AND array_length(features, 1) > 0 THEN 1 END) as with_features,
  COUNT(CASE WHEN elevator = true THEN 1 END) as with_elevator_field,
  COUNT(CASE WHEN portaria_24h = true THEN 1 END) as with_portaria_field
FROM properties;

-- AUDITORIA: Ver se ainda existem duplicatas
SELECT id, features, elevator, portaria_24h
FROM properties
WHERE (
  EXISTS (
    SELECT 1 FROM unnest(features) AS f
    WHERE LOWER(f) IN ('elevador', 'portaria 24h', 'portaria')
  )
)
LIMIT 20;

-- =====================================================
-- ROLLBACK (caso necessário):
-- =====================================================
-- UPDATE properties p
-- SET features = b.features
-- FROM properties_backup_features b
-- WHERE p.id = b.id;
-- 
-- DROP TABLE properties_backup_features;
-- =====================================================
