# 🔧 Instruções para Corrigir Cores e Logo

## Problemas Identificados

1. ❌ **"Detalhes do Imóvel" aparece CINZA** → Deveria estar **PRETO**
2. ❌ **Footer mostra logo pequeno + nome** → Deveria mostrar **imagem 400x80**

## Causa Raiz

As funções RPC `get_public_broker_branding` e `get_public_broker_branding_secure` **não estavam retornando** os campos:
- `header_brand_image_url`
- `detail_header_text_color`
- `detail_button_color`
- `search_button_color`

---

## 📋 Passo a Passo para Corrigir

### Passo 1: Adicionar os Campos de Cor (se ainda não fez)

Acesse o [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql) e execute:

```sql
ALTER TABLE brokers
ADD COLUMN IF NOT EXISTS detail_header_text_color TEXT,
ADD COLUMN IF NOT EXISTS detail_button_color TEXT,
ADD COLUMN IF NOT EXISTS search_button_color TEXT;
```

### Passo 2: Atualizar as Funções RPC

No mesmo SQL Editor, execute todo o conteúdo do arquivo:
`supabase/migrations/20250112000002_update_broker_branding_functions.sql`

Ou copie e cole este SQL completo:

```sql
-- Update get_public_broker_branding to include header_brand_image_url and custom color fields
DROP FUNCTION IF EXISTS public.get_public_broker_branding(text);

CREATE OR REPLACE FUNCTION public.get_public_broker_branding(broker_website_slug text DEFAULT NULL::text)
 RETURNS TABLE(
   id uuid,
   business_name text,
   display_name text,
   website_slug text,
   logo_url text,
   logo_size integer,
   header_brand_image_url text,
   primary_color text,
   secondary_color text,
   detail_header_text_color text,
   detail_button_color text,
   search_button_color text,
   about_text text,
   footer_text text,
   whatsapp_button_color text,
   whatsapp_button_text text,
   background_image_url text,
   overlay_color text,
   overlay_opacity text,
   hero_title text,
   hero_subtitle text,
   address text,
   cnpj text,
   is_active boolean,
   created_at timestamp with time zone,
   updated_at timestamp with time zone,
   tracking_scripts jsonb,
   about_us_content text,
   privacy_policy_content text,
   terms_of_use_content text,
   sections_background_style text,
   sections_background_color_1 text,
   sections_background_color_2 text,
   sections_background_color_3 text,
   site_title text,
   site_description text,
   site_favicon_url text,
   site_share_image_url text,
   robots_index boolean,
   robots_follow boolean,
   canonical_prefer_custom_domain boolean,
   home_title_template text,
   home_description_template text,
   property_title_template text,
   property_description_template text,
   custom_domain text
 )
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    b.business_name,
    b.display_name,
    b.website_slug,
    b.logo_url,
    b.logo_size,
    b.header_brand_image_url,
    b.primary_color,
    b.secondary_color,
    b.detail_header_text_color,
    b.detail_button_color,
    b.search_button_color,
    b.about_text,
    b.footer_text,
    b.whatsapp_button_color,
    b.whatsapp_button_text,
    b.background_image_url,
    b.overlay_color,
    b.overlay_opacity,
    b.hero_title,
    b.hero_subtitle,
    b.address,
    b.cnpj,
    b.is_active,
    b.created_at,
    b.updated_at,
    b.tracking_scripts,
    b.about_us_content,
    b.privacy_policy_content,
    b.terms_of_use_content,
    b.sections_background_style,
    b.sections_background_color_1,
    b.sections_background_color_2,
    b.sections_background_color_3,
    b.site_title,
    b.site_description,
    b.site_favicon_url,
    b.site_share_image_url,
    COALESCE(b.robots_index, true) as robots_index,
    COALESCE(b.robots_follow, true) as robots_follow,
    COALESCE(b.canonical_prefer_custom_domain, true) as canonical_prefer_custom_domain,
    b.home_title_template,
    b.home_description_template,
    b.property_title_template,
    b.property_description_template,
    b.custom_domain
  FROM public.brokers b
  WHERE b.is_active = true
    AND (broker_website_slug IS NULL OR b.website_slug = broker_website_slug);
END;
$function$;

-- Update get_public_broker_branding_secure to include same fields
DROP FUNCTION IF EXISTS public.get_public_broker_branding_secure(text);

CREATE OR REPLACE FUNCTION public.get_public_broker_branding_secure(broker_website_slug text DEFAULT NULL::text)
 RETURNS TABLE(
   id uuid,
   business_name text,
   display_name text,
   website_slug text,
   logo_url text,
   logo_size integer,
   header_brand_image_url text,
   primary_color text,
   secondary_color text,
   detail_header_text_color text,
   detail_button_color text,
   search_button_color text,
   about_text text,
   footer_text text,
   whatsapp_button_color text,
   whatsapp_button_text text,
   background_image_url text,
   overlay_color text,
   overlay_opacity text,
   hero_title text,
   hero_subtitle text,
   is_active boolean,
   created_at timestamp with time zone,
   updated_at timestamp with time zone,
   tracking_scripts jsonb,
   about_us_content text,
   privacy_policy_content text,
   terms_of_use_content text,
   whatsapp_number text,
   site_title text,
   site_description text,
   site_favicon_url text,
   site_share_image_url text,
   custom_domain text
 )
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    b.business_name,
    b.display_name,
    b.website_slug,
    b.logo_url,
    b.logo_size,
    b.header_brand_image_url,
    b.primary_color,
    b.secondary_color,
    b.detail_header_text_color,
    b.detail_button_color,
    b.search_button_color,
    b.about_text,
    b.footer_text,
    b.whatsapp_button_color,
    b.whatsapp_button_text,
    b.background_image_url,
    b.overlay_color,
    b.overlay_opacity,
    b.hero_title,
    b.hero_subtitle,
    b.is_active,
    b.created_at,
    b.updated_at,
    b.tracking_scripts,
    b.about_us_content,
    b.privacy_policy_content,
    b.terms_of_use_content,
    b.whatsapp_number,
    b.site_title,
    b.site_description,
    b.site_favicon_url,
    b.site_share_image_url,
    b.custom_domain
  FROM public.brokers b
  WHERE b.is_active = true
    AND (broker_website_slug IS NULL OR b.website_slug = broker_website_slug);
END;
$function$;
```

### Passo 3: Limpar Cache do Navegador

Após executar os SQLs acima, limpe o cache:
- **Chrome/Edge**: `Ctrl + Shift + R` (Windows/Linux) ou `Cmd + Shift + R` (Mac)
- **Firefox**: `Ctrl + F5`

### Passo 4: Recarregar a Página

Acesse novamente: https://rfimobiliaria.adminimobiliaria.site/casa-bela-vista-651438be

---

## ✅ Resultado Esperado

Após executar todos os passos:

1. ✅ **"Detalhes do Imóvel"** aparecerá em **PRETO** (#000000)
2. ✅ **Footer** mostrará a **imagem 400x80** (header_brand_image_url)
3. ✅ **Botões "Ver Detalhes"** usarão a cor **VERMELHA** (#d90707)
4. ✅ **Botão "Buscar"** usará a cor configurada (#6c7691)

---

## 🐛 Troubleshooting

### Se "Detalhes do Imóvel" ainda estiver cinza:

Execute no Supabase SQL Editor:
```sql
SELECT 
  business_name,
  detail_header_text_color,
  header_brand_image_url,
  primary_color
FROM brokers
WHERE website_slug = 'rfimobiliaria';
```

Verifique se:
- `detail_header_text_color` = `#000000`
- `header_brand_image_url` tem uma URL válida

### Se o Footer não mostrar a imagem 400x80:

Verifique se o campo `header_brand_image_url` está preenchido no banco de dados.

---

**Executar esses passos resolverá AMBOS os problemas!** 🎉
