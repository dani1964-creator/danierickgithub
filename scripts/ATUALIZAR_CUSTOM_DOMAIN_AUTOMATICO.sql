-- ============================================================================
-- SCRIPT: Sincronização Automática de Domínio Personalizado
-- ============================================================================
-- Este script cria triggers e funções para:
-- 1. Atualizar automaticamente a coluna custom_domain em brokers quando dns_zones é ativada
-- 2. Limpar custom_domain quando a zona é deletada ou desativada
-- 3. Manter sincronização entre dns_zones e brokers.custom_domain
-- 4. Integração com domain_verifications e broker_domains
-- ============================================================================
-- 
-- TABELAS DO SEU BANCO:
-- - public.brokers (custom_domain, subdomain, domain_config)
-- - public.dns_zones (domain, status, nameservers, broker_id)
-- - public.dns_records (zone_id, record_type, name, value)
-- - public.domain_verifications (domain, expected_cname, is_valid, broker_id)
-- - public.broker_domains (domain, broker_id, is_active)
-- ============================================================================

-- Função 1: Atualizar custom_domain no broker quando zona DNS é ativada
CREATE OR REPLACE FUNCTION sync_custom_domain_on_zone_active()
RETURNS TRIGGER AS $$
BEGIN
  -- Se a zona mudou para status 'active', atualizar o broker
  IF NEW.status = 'active' AND (OLD.status IS NULL OR OLD.status != 'active') THEN
    UPDATE brokers
    SET custom_domain = NEW.domain
    WHERE id = NEW.broker_id;
    
    RAISE NOTICE 'Domínio % atualizado para broker %', NEW.domain, NEW.broker_id;
  END IF;
  
  -- Se a zona foi desativada (failed ou mudou para outro status), limpar custom_domain
  IF OLD.status = 'active' AND NEW.status != 'active' THEN
    UPDATE brokers
    SET custom_domain = NULL
    WHERE id = NEW.broker_id 
      AND custom_domain = OLD.domain;
    
    RAISE NOTICE 'Domínio % removido do broker %', OLD.domain, OLD.broker_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função 2: Limpar custom_domain quando zona DNS é deletada
CREATE OR REPLACE FUNCTION sync_custom_domain_on_zone_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Remover custom_domain do broker quando zona for deletada
  UPDATE brokers
  SET custom_domain = NULL
  WHERE id = OLD.broker_id 
    AND custom_domain = OLD.domain;
  
  RAISE NOTICE 'Domínio % removido do broker % (zona deletada)', OLD.domain, OLD.broker_id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger 1: Executar quando zona DNS for atualizada
DROP TRIGGER IF EXISTS trigger_sync_custom_domain_on_update ON dns_zones;
CREATE TRIGGER trigger_sync_custom_domain_on_update
  AFTER UPDATE ON dns_zones
  FOR EACH ROW
  EXECUTE FUNCTION sync_custom_domain_on_zone_active();

-- Trigger 2: Executar quando zona DNS for deletada
DROP TRIGGER IF EXISTS trigger_sync_custom_domain_on_delete ON dns_zones;
CREATE TRIGGER trigger_sync_custom_domain_on_delete
  BEFORE DELETE ON dns_zones
  FOR EACH ROW
  EXECUTE FUNCTION sync_custom_domain_on_zone_delete();

-- ============================================================================
-- ATUALIZAÇÃO RETROATIVA
-- ============================================================================
-- Sincronizar domínios já existentes que estão ativos mas não foram atualizados
UPDATE brokers b
SET custom_domain = dz.domain
FROM dns_zones dz
WHERE dz.broker_id = b.id
  AND dz.status = 'active'
  AND (b.custom_domain IS NULL OR b.custom_domain != dz.domain);

-- ============================================================================
-- VERIFICAÇÃO E TESTES
-- ============================================================================

-- Verificar zonas ativas sem custom_domain configurado
SELECT 
  b.id as broker_id,
  b.business_name,
  b.custom_domain as domain_atual,
  dz.domain as domain_na_zona,
  dz.status
FROM brokers b
INNER JOIN dns_zones dz ON dz.broker_id = b.id
WHERE dz.status = 'active'
  AND (b.custom_domain IS NULL OR b.custom_domain != dz.domain);

-- Verificar brokers com custom_domain mas sem zona ativa
SELECT 
  b.id as broker_id,
  b.business_name,
  b.custom_domain,
  dz.domain as zona_domain,
  dz.status as zona_status
FROM brokers b
LEFT JOIN dns_zones dz ON dz.broker_id = b.id AND dz.status = 'active'
WHERE b.custom_domain IS NOT NULL
  AND (dz.id IS NULL OR dz.domain != b.custom_domain);

-- ============================================================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- ============================================================================

COMMENT ON FUNCTION sync_custom_domain_on_zone_active() IS 
'Sincroniza automaticamente custom_domain na tabela brokers quando uma zona DNS é ativada ou desativada';

COMMENT ON FUNCTION sync_custom_domain_on_zone_delete() IS 
'Remove custom_domain da tabela brokers quando a zona DNS é deletada';

COMMENT ON TRIGGER trigger_sync_custom_domain_on_update ON dns_zones IS 
'Trigger que atualiza custom_domain no broker quando zona muda de status';

COMMENT ON TRIGGER trigger_sync_custom_domain_on_delete ON dns_zones IS 
'Trigger que limpa custom_domain no broker quando zona é deletada';

-- ============================================================================
-- INSTRUÇÕES DE USO
-- ============================================================================
/*

COMO FUNCIONA:

1. Quando uma zona DNS é criada com status 'active' → custom_domain é preenchido automaticamente
2. Quando uma zona é verificada e muda para 'active' → custom_domain é atualizado
3. Quando uma zona é desativada (failed/pending) → custom_domain é limpo
4. Quando uma zona é deletada → custom_domain é limpo

FLUXO AUTOMÁTICO:
┌─────────────────┐
│  Cliente cria   │
│  domínio na UI  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ dns_zones criada│
│ status=verifying│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Cron verifica NS│
│ status=active   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ TRIGGER atualiza│
│ custom_domain   │
└─────────────────┘

PARA TESTAR:
1. Execute este script no Supabase SQL Editor
2. Crie um domínio via UI (aba Domínio)
3. Quando o cron verificar e ativar, custom_domain será preenchido automaticamente

PARA VERIFICAR:
SELECT b.id, b.business_name, b.custom_domain, dz.domain, dz.status 
FROM brokers b 
LEFT JOIN dns_zones dz ON dz.broker_id = b.id 
WHERE b.id = 'SEU_BROKER_ID';

*/
