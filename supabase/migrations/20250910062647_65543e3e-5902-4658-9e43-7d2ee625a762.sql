-- Add unique constraint to custom_domain
ALTER TABLE public.brokers ADD CONSTRAINT unique_custom_domain UNIQUE (custom_domain);

-- Create function to validate domain ownership
CREATE OR REPLACE FUNCTION public.validate_domain_ownership(p_domain text, p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.brokers 
    WHERE custom_domain = p_domain 
    AND user_id = p_user_id 
    AND is_active = true
  );
END;
$$;

-- Create function to get broker by domain with security validation
CREATE OR REPLACE FUNCTION public.get_broker_by_domain_secure(p_domain text)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  business_name text,
  display_name text,
  website_slug text,
  custom_domain text,
  logo_url text,
  logo_size integer,
  primary_color text,
  secondary_color text,
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
  site_share_image_url text
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log domain access attempt
  INSERT INTO public.security_logs (
    event_type,
    user_id,
    metadata
  ) VALUES (
    'domain_access',
    auth.uid(),
    jsonb_build_object(
      'domain', p_domain,
      'timestamp', NOW(),
      'user_agent', current_setting('request.headers', true)::json->>'user-agent'
    )
  );

  RETURN QUERY
  SELECT 
    b.id,
    b.user_id,
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
  WHERE b.custom_domain = p_domain 
    AND b.is_active = true;
END;
$$;