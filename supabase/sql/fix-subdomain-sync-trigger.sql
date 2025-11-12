-- ============================================================================
-- SOLUÇÃO DEFINITIVA: Sincronização automática de website_slug e subdomain
-- ============================================================================
-- PROBLEMA: 
--   - website_slug e subdomain estão desincronizados
--   - Admin panel atualiza um mas não o outro consistentemente
--   - Queries precisam verificar ambos os campos (OR condition)
--
-- DECISÃO ARQUITETURAL:
--   - website_slug = FONTE DA VERDADE (usado em todas as RPCs e URLs)
--   - subdomain = SINÔNIMO/ALIAS (para compatibilidade e domínios *.adminimobiliaria.site)
--   - custom_domain = Domínio próprio do cliente (opcional)
--
-- SOLUÇÃO:
--   - Trigger que mantém subdomain SEMPRE igual a website_slug
--   - Simplifica queries (não precisa mais de OR condition)
--   - Migração para sincronizar dados existentes
-- ============================================================================

-- ============================================================================
-- 1. FUNÇÃO DO TRIGGER: Sincronizar subdomain com website_slug
-- ============================================================================
CREATE OR REPLACE FUNCTION public.sync_broker_subdomain()
RETURNS TRIGGER AS $$
BEGIN
  -- Se website_slug foi alterado, sincronizar subdomain
  IF NEW.website_slug IS DISTINCT FROM OLD.website_slug THEN
    NEW.subdomain := NEW.website_slug;
    RAISE NOTICE 'Synced subdomain to website_slug: %', NEW.website_slug;
  END IF;
  
  -- Se alguém tentar alterar apenas subdomain (sem website_slug), 
  -- atualizar website_slug também para manter consistência
  IF NEW.subdomain IS DISTINCT FROM OLD.subdomain 
     AND NEW.website_slug = OLD.website_slug THEN
    NEW.website_slug := NEW.subdomain;
    RAISE NOTICE 'Synced website_slug to subdomain: %', NEW.subdomain;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 2. TRIGGER: Executar em BEFORE UPDATE
-- ============================================================================
DROP TRIGGER IF EXISTS trigger_sync_broker_subdomain ON public.brokers;

CREATE TRIGGER trigger_sync_broker_subdomain
  BEFORE UPDATE ON public.brokers
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_broker_subdomain();

-- ============================================================================
-- 3. MIGRAÇÃO: Sincronizar todos os brokers existentes
-- ============================================================================
-- Garantir que todos os brokers tenham subdomain = website_slug
UPDATE public.brokers
SET subdomain = website_slug,
    updated_at = NOW()
WHERE subdomain IS DISTINCT FROM website_slug;

-- Verificar resultado
SELECT 
  id,
  business_name,
  website_slug,
  subdomain,
  CASE 
    WHEN website_slug = subdomain THEN '✅ Sincronizado'
    ELSE '❌ Desincronizado'
  END as status
FROM public.brokers
ORDER BY business_name;

-- ============================================================================
-- 4. SIMPLIFICAR QUERIES: Agora só precisa verificar um campo
-- ============================================================================
-- ANTES (complexo):
-- SELECT * FROM brokers 
-- WHERE (subdomain = 'rfimobiliaria' OR website_slug = 'rfimobiliaria')
--   AND is_active = true;

-- DEPOIS (simples):
-- SELECT * FROM brokers 
-- WHERE website_slug = 'rfimobiliaria'
--   AND is_active = true;

-- ============================================================================
-- 5. TESTES DO TRIGGER
-- ============================================================================

-- Teste 1: Atualizar website_slug deve atualizar subdomain automaticamente
UPDATE public.brokers
SET website_slug = 'teste-sync'
WHERE id = (SELECT id FROM brokers LIMIT 1);

-- Verificar: subdomain deve ser 'teste-sync' também
SELECT website_slug, subdomain FROM brokers 
WHERE id = (SELECT id FROM brokers LIMIT 1);

-- Teste 2: Atualizar subdomain deve atualizar website_slug automaticamente
UPDATE public.brokers
SET subdomain = 'teste-sync-2'
WHERE id = (SELECT id FROM brokers LIMIT 1);

-- Verificar: website_slug deve ser 'teste-sync-2' também
SELECT website_slug, subdomain FROM brokers 
WHERE id = (SELECT id FROM brokers LIMIT 1);

-- ============================================================================
-- 6. DOCUMENTAÇÃO DA ARQUITETURA
-- ============================================================================
COMMENT ON COLUMN public.brokers.website_slug IS 
  'Slug principal do broker, usado em URLs e RPCs. FONTE DA VERDADE.';

COMMENT ON COLUMN public.brokers.subdomain IS 
  'Alias para website_slug, mantido sincronizado via trigger. Usado em *.adminimobiliaria.site';

COMMENT ON COLUMN public.brokers.custom_domain IS 
  'Domínio personalizado do cliente (ex: www.imobiliaria.com.br). Opcional.';

COMMENT ON TRIGGER trigger_sync_broker_subdomain ON public.brokers IS 
  'Mantém subdomain sincronizado com website_slug automaticamente';

-- ============================================================================
-- RESULTADO ESPERADO:
-- ============================================================================
-- 1. ✅ website_slug e subdomain sempre idênticos
-- 2. ✅ Admin panel pode atualizar qualquer um, trigger sincroniza o outro
-- 3. ✅ Queries simplificadas (só verificar website_slug)
-- 4. ✅ Sem necessidade de OR conditions complexas
-- 5. ✅ Dados históricos corrigidos via migração
-- ============================================================================

-- ============================================================================
-- ROLLBACK (se necessário):
-- ============================================================================
-- DROP TRIGGER IF EXISTS trigger_sync_broker_subdomain ON public.brokers;
-- DROP FUNCTION IF EXISTS public.sync_broker_subdomain();
-- ============================================================================
