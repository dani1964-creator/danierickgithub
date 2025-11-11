# 🚀 SQLs para Executar no Supabase SQL Editor

**Link:** https://supabase.com/dashboard/project/demcjskpwcxqohzlyjxb/sql/new

Execute os SQLs nesta ordem:

---

## ✅ SQL 1: Função Slug-Only (Property Detail)

**O que faz:** Atualiza a função RPC para aceitar APENAS slugs nas URLs dos imóveis.

**Resultado:** URLs funcionarão apenas como `danierick.adminimobiliaria.site/apartamento-3-quartos`

```sql
-- Atualiza função RPC para aceitar APENAS slug no parâmetro property_slug
-- Remove compatibilidade com UUID - força uso de URLs amigáveis

DROP FUNCTION IF EXISTS public.get_public_property_detail_with_realtor(text, text);

CREATE OR REPLACE FUNCTION public.get_public_property_detail_with_realtor(
  broker_slug text,
  property_slug text
)
RETURNS TABLE(
  -- Property fields
  id uuid,
  title text,
  description text,
  property_type text,
  transaction_type text,
  address text,
  neighborhood text,
  city text,
  uf text,
  main_image_url text,
  images text[],
  features text[],
  price numeric,
  bedrooms integer,
  bathrooms integer,
  parking_spaces integer,
  area_m2 numeric,
  private_area_m2 numeric,
  total_area_m2 numeric,
  suites integer,
  covered_parking_spaces integer,
  floor_number integer,
  total_floors integer,
  built_year integer,
  sunlight_orientation text,
  property_condition text,
  water_cost numeric,
  electricity_cost numeric,
  hoa_fee numeric,
  hoa_periodicity text,
  iptu_value numeric,
  iptu_periodicity text,
  furnished boolean,
  accepts_pets boolean,
  elevator boolean,
  portaria_24h boolean,
  gas_included boolean,
  accessibility boolean,
  heating_type text,
  notes text,
  views_count integer,
  is_featured boolean,
  status text,
  slug text,
  property_code text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  -- Broker fields
  broker_business_name text,
  broker_website_slug text,
  broker_display_name text,
  -- Realtor fields (safe to expose publicly)
  realtor_name text,
  realtor_avatar_url text,
  realtor_creci text,
  realtor_bio text,
  realtor_whatsapp_button_text text
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.description,
    p.property_type,
    p.transaction_type,
    p.address,
    p.neighborhood,
    p.city,
    p.uf,
    p.main_image_url,
    p.images,
    p.features,
    p.price,
    p.bedrooms,
    p.bathrooms,
    p.parking_spaces,
    p.area_m2,
    p.private_area_m2,
    p.total_area_m2,
    p.suites,
    p.covered_parking_spaces,
    p.floor_number,
    p.total_floors,
    p.built_year,
    p.sunlight_orientation,
    p.property_condition,
    p.water_cost,
    p.electricity_cost,
    p.hoa_fee,
    p.hoa_periodicity,
    p.iptu_value,
    p.iptu_periodicity,
    p.furnished,
    p.accepts_pets,
    p.elevator,
    p.portaria_24h,
    p.gas_included,
    p.accessibility,
    p.heating_type,
    p.notes,
    p.views_count,
    p.is_featured,
    p.status,
    p.slug,
    p.property_code,
    p.created_at,
    p.updated_at,
    b.business_name as broker_business_name,
    b.website_slug as broker_website_slug,
    b.display_name as broker_display_name,
    r.name as realtor_name,
    r.avatar_url as realtor_avatar_url,
    r.creci as realtor_creci,
    r.bio as realtor_bio,
    r.whatsapp_button_text as realtor_whatsapp_button_text
  FROM public.properties p
  JOIN public.brokers b ON p.broker_id = b.id
  LEFT JOIN public.realtors r ON p.realtor_id = r.id
  WHERE p.is_active = true
    AND b.is_active = true
    AND b.website_slug = broker_slug
    AND p.slug = property_slug;  -- APENAS slug, não UUID
END;
$$;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
```

---

## ⚡ SQL 2: Índices de Performance (Brokers)

**O que faz:** Cria índices para acelerar lookups por custom_domain e website_slug.

**Resultado:** Queries de broker ficam até 100x mais rápidas!

```sql
-- Migration para adicionar índices de performance em brokers
-- Otimiza lookup por custom_domain e website_slug

-- Índice único para custom_domain (garante que não há domínios duplicados)
-- Usa lower() para case-insensitive e WHERE para ignorar NULLs
CREATE UNIQUE INDEX IF NOT EXISTS idx_brokers_custom_domain_unique 
ON public.brokers (lower(custom_domain)) 
WHERE custom_domain IS NOT NULL;

-- Índice para website_slug (acelera lookups por subdomínio)
CREATE INDEX IF NOT EXISTS idx_brokers_website_slug 
ON public.brokers (website_slug) 
WHERE is_active = true;

-- Índice composto para a query mais comum: lookup ativo por slug
CREATE INDEX IF NOT EXISTS idx_brokers_active_slug 
ON public.brokers (website_slug, is_active);

-- Comentários explicativos
COMMENT ON INDEX idx_brokers_custom_domain_unique IS 'Garante unicidade de domínios customizados (case-insensitive)';
COMMENT ON INDEX idx_brokers_website_slug IS 'Acelera lookup por website_slug para brokers ativos';
COMMENT ON INDEX idx_brokers_active_slug IS 'Índice composto para queries de broker ativo por slug';
```

---

## ✅ Checklist de Execução

- [ ] Abrir SQL Editor do Supabase
- [ ] Copiar e executar SQL 1 (Slug-Only)
- [ ] Verificar mensagem "Success" no SQL Editor
- [ ] Copiar e executar SQL 2 (Índices)
- [ ] Verificar mensagem "Success" no SQL Editor
- [ ] Testar URL com slug: `https://danierick.adminimobiliaria.site/[slug-do-imovel]`

---

## 📊 Verificação Pós-Execução

Após executar ambos SQLs, você pode verificar se funcionou:

```sql
-- Verificar se a função foi atualizada
SELECT routine_name, routine_definition 
FROM information_schema.routines 
WHERE routine_name = 'get_public_property_detail_with_realtor';

-- Verificar índices criados
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'brokers' 
AND indexname LIKE 'idx_brokers%';
```

---

**Status Atual:**
- ✅ Broker R&F (danierick): custom_domain = NULL (correto, usa apenas subdomínio)
- ✅ Migrations criadas e prontas para execução
- ⏳ Aguardando execução manual no SQL Editor
