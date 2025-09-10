-- Update get_broker_by_domain_or_slug to include logo_size
CREATE OR REPLACE FUNCTION public.get_broker_by_domain_or_slug(domain_name text DEFAULT NULL::text, slug_name text DEFAULT NULL::text)
 RETURNS TABLE(id uuid, business_name text, display_name text, website_slug text, custom_domain text, logo_url text, logo_size integer, primary_color text, secondary_color text, about_text text, footer_text text, whatsapp_button_color text, whatsapp_button_text text, background_image_url text, overlay_color text, overlay_opacity text, hero_title text, hero_subtitle text, is_active boolean, created_at timestamp with time zone, updated_at timestamp with time zone, tracking_scripts jsonb, about_us_content text, privacy_policy_content text, terms_of_use_content text, whatsapp_number text, site_title text, site_description text, site_favicon_url text, site_share_image_url text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- First try to find by custom domain
  IF domain_name IS NOT NULL THEN
    RETURN QUERY
    SELECT 
      b.id,
      b.business_name,
      b.display_name,
      b.website_slug,
      b.custom_domain,
      b.logo_url,
      b.logo_size,
      b.primary_color,
      b.secondary_color,
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
      b.site_share_image_url
    FROM public.brokers b
    WHERE b.is_active = true
      AND b.custom_domain = domain_name;
    
    -- If found by domain, return
    IF FOUND THEN
      RETURN;
    END IF;
  END IF;
  
  -- If not found by domain or no domain provided, try by slug
  IF slug_name IS NOT NULL THEN
    RETURN QUERY
    SELECT 
      b.id,
      b.business_name,
      b.display_name,
      b.website_slug,
      b.custom_domain,
      b.logo_url,
      b.logo_size,
      b.primary_color,
      b.secondary_color,
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
      b.site_share_image_url
    FROM public.brokers b
    WHERE b.is_active = true
      AND b.website_slug = slug_name;
  END IF;
END;
$function$;

-- Update get_public_broker_branding to include logo_size
CREATE OR REPLACE FUNCTION public.get_public_broker_branding(broker_website_slug text DEFAULT NULL::text)
 RETURNS TABLE(id uuid, business_name text, display_name text, website_slug text, logo_url text, logo_size integer, primary_color text, secondary_color text, about_text text, footer_text text, whatsapp_button_color text, whatsapp_button_text text, background_image_url text, overlay_color text, overlay_opacity text, hero_title text, hero_subtitle text, address text, cnpj text, is_active boolean, created_at timestamp with time zone, updated_at timestamp with time zone, tracking_scripts jsonb, about_us_content text, privacy_policy_content text, terms_of_use_content text, sections_background_style text, sections_background_color_1 text, sections_background_color_2 text, sections_background_color_3 text, site_title text, site_description text, site_favicon_url text, site_share_image_url text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- This function exposes safe branding information including SEO fields for public display
  RETURN QUERY
  SELECT 
    b.id,
    b.business_name,
    b.display_name,
    b.website_slug,
    b.logo_url,
    b.logo_size,
    b.primary_color,
    b.secondary_color,
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
    b.site_share_image_url
  FROM public.brokers b
  WHERE b.is_active = true
    AND (broker_website_slug IS NULL OR b.website_slug = broker_website_slug);
END;
$function$;

-- Update get_public_broker_branding_secure to include logo_size  
CREATE OR REPLACE FUNCTION public.get_public_broker_branding_secure(broker_website_slug text DEFAULT NULL::text)
 RETURNS TABLE(id uuid, business_name text, display_name text, website_slug text, logo_url text, logo_size integer, primary_color text, secondary_color text, about_text text, footer_text text, whatsapp_button_color text, whatsapp_button_text text, background_image_url text, overlay_color text, overlay_opacity text, hero_title text, hero_subtitle text, is_active boolean, created_at timestamp with time zone, updated_at timestamp with time zone, tracking_scripts jsonb, about_us_content text, privacy_policy_content text, terms_of_use_content text, whatsapp_number text, site_title text, site_description text, site_favicon_url text, site_share_image_url text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- This function includes whatsapp_number for contact functionality and SEO fields
  RETURN QUERY
  SELECT 
    b.id,
    b.business_name,
    b.display_name,
    b.website_slug,
    b.logo_url,
    b.logo_size,
    b.primary_color,
    b.secondary_color,
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
    b.site_share_image_url
  FROM public.brokers b
  WHERE b.is_active = true
    AND (broker_website_slug IS NULL OR b.website_slug = broker_website_slug);
END;
$function$;