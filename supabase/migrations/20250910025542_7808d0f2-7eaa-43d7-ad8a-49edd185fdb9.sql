-- Fix search_path issues in database functions and improve leads RLS
-- First, update functions to have proper search_path

-- Update validate_broker_input function
CREATE OR REPLACE FUNCTION public.validate_broker_input()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Validate business name length
  IF length(NEW.business_name) > 100 THEN
    RAISE EXCEPTION 'Business name must be 100 characters or less';
  END IF;
  
  -- Validate display name length
  IF NEW.display_name IS NOT NULL AND length(NEW.display_name) > 100 THEN
    RAISE EXCEPTION 'Display name must be 100 characters or less';
  END IF;
  
  -- Validate email format (basic check)
  IF NEW.email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;
  
  -- Validate phone format if provided (basic check for digits, spaces, dashes, parentheses)
  IF NEW.phone IS NOT NULL AND NEW.phone !~ '^[\d\s\-\(\)\+]+$' THEN
    RAISE EXCEPTION 'Invalid phone format';
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Update validate_lead_input function
CREATE OR REPLACE FUNCTION public.validate_lead_input()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Validate name length
  IF length(NEW.name) > 100 THEN
    RAISE EXCEPTION 'Name must be 100 characters or less';
  END IF;
  
  -- Validate email format
  IF NEW.email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;
  
  -- Validate phone format if provided
  IF NEW.phone IS NOT NULL AND NEW.phone !~ '^[\d\s\-\(\)\+]+$' THEN
    RAISE EXCEPTION 'Invalid phone format';
  END IF;
  
  -- Validate message length
  IF NEW.message IS NOT NULL AND length(NEW.message) > 2000 THEN
    RAISE EXCEPTION 'Message must be 2000 characters or less';
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Update validate_property_input function
CREATE OR REPLACE FUNCTION public.validate_property_input()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Validate title length
  IF length(NEW.title) > 200 THEN
    RAISE EXCEPTION 'Title must be 200 characters or less';
  END IF;
  
  -- Validate description length
  IF length(NEW.description) > 5000 THEN
    RAISE EXCEPTION 'Description must be 5000 characters or less';
  END IF;
  
  -- Validate price is positive
  IF NEW.price <= 0 THEN
    RAISE EXCEPTION 'Price must be greater than 0';
  END IF;
  
  -- Validate numeric fields are not negative
  IF NEW.bedrooms < 0 OR NEW.bathrooms < 0 OR NEW.parking_spaces < 0 OR NEW.area_m2 < 0 THEN
    RAISE EXCEPTION 'Numeric fields cannot be negative';
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Update generate_slug function
CREATE OR REPLACE FUNCTION public.generate_slug(title text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  slug_text TEXT;
BEGIN
  -- Convert to lowercase, replace spaces and special chars with hyphens
  slug_text := LOWER(title);
  slug_text := REGEXP_REPLACE(slug_text, '[àáâãäå]', 'a', 'g');
  slug_text := REGEXP_REPLACE(slug_text, '[èéêë]', 'e', 'g');
  slug_text := REGEXP_REPLACE(slug_text, '[ìíîï]', 'i', 'g');
  slug_text := REGEXP_REPLACE(slug_text, '[òóôõö]', 'o', 'g');
  slug_text := REGEXP_REPLACE(slug_text, '[ùúûü]', 'u', 'g');
  slug_text := REGEXP_REPLACE(slug_text, '[ç]', 'c', 'g');
  slug_text := REGEXP_REPLACE(slug_text, '[ñ]', 'n', 'g');
  slug_text := REGEXP_REPLACE(slug_text, '[^a-z0-9\s\-]', '', 'g');
  slug_text := REGEXP_REPLACE(slug_text, '\s+', '-', 'g');
  slug_text := REGEXP_REPLACE(slug_text, '-+', '-', 'g');
  slug_text := TRIM(BOTH '-' FROM slug_text);
  
  RETURN slug_text;
END;
$function$;

-- Update set_property_slug function
CREATE OR REPLACE FUNCTION public.set_property_slug()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_slug(NEW.title) || '-' || SUBSTRING(NEW.id::text, 1, 8);
  END IF;
  RETURN NEW;
END;
$function$;

-- Update update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Update handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.brokers (
    user_id, 
    business_name, 
    email,
    primary_color,
    secondary_color,
    plan_type,
    is_active,
    max_properties
  )
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'business_name', 'Minha Imobiliária'),
    NEW.email,
    '#2563eb',
    '#64748b', 
    'free',
    true,
    5
  );
  RETURN NEW;
END;
$function$;

-- Update handle_new_broker function
CREATE OR REPLACE FUNCTION public.handle_new_broker()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.brokers (user_id, business_name, display_name, email, website_slug)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'business_name', 'Minha Imobiliária'),
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.email),
    NEW.email,
    LOWER(REPLACE(COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.email), ' ', '-')) || '-' || substr(NEW.id::text, 1, 8)
  );
  RETURN NEW;
END;
$function$;

-- Improve leads rate limiting function with better security
CREATE OR REPLACE FUNCTION public.check_lead_rate_limit_enhanced(client_ip inet DEFAULT NULL::inet, user_email text DEFAULT NULL::text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  -- Enhanced rate limiting: 
  -- - Max 5 leads per email per hour (prevent spam from same email)
  -- - Max 20 leads per IP per hour (prevent IP-based spam)
  SELECT 
    (SELECT COUNT(*) FROM public.leads WHERE email = user_email AND created_at > NOW() - INTERVAL '1 hour') < 5
    AND
    (SELECT COUNT(*) FROM public.leads WHERE created_at > NOW() - INTERVAL '1 hour') < 20;
$function$;

-- Create audit trigger for leads table to track sensitive data access
CREATE OR REPLACE FUNCTION public.audit_lead_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Log any access to sensitive lead data
  INSERT INTO public.security_logs (
    event_type,
    user_id,
    metadata
  ) VALUES (
    'lead_data_access',
    auth.uid(),
    jsonb_build_object(
      'lead_id', COALESCE(NEW.id, OLD.id),
      'operation', TG_OP,
      'broker_id', COALESCE(NEW.broker_id, OLD.broker_id)
    )
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Create the audit trigger for leads
DROP TRIGGER IF EXISTS audit_lead_access_trigger ON public.leads;
CREATE TRIGGER audit_lead_access_trigger
  AFTER SELECT OR INSERT OR UPDATE OR DELETE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.audit_lead_access();

-- Update lead validation triggers
DROP TRIGGER IF EXISTS validate_lead_trigger ON public.leads;
CREATE TRIGGER validate_lead_trigger
  BEFORE INSERT OR UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.validate_lead_input();

-- Update property validation triggers  
DROP TRIGGER IF EXISTS validate_property_trigger ON public.properties;
CREATE TRIGGER validate_property_trigger
  BEFORE INSERT OR UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.validate_property_input();

-- Update broker validation triggers
DROP TRIGGER IF EXISTS validate_broker_trigger ON public.brokers;
CREATE TRIGGER validate_broker_trigger
  BEFORE INSERT OR UPDATE ON public.brokers
  FOR EACH ROW EXECUTE FUNCTION public.validate_broker_input();

-- Update property slug triggers
DROP TRIGGER IF EXISTS set_property_slug_trigger ON public.properties;
CREATE TRIGGER set_property_slug_trigger
  BEFORE INSERT OR UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.set_property_slug();

-- Update timestamp triggers
DROP TRIGGER IF EXISTS update_brokers_updated_at ON public.brokers;
CREATE TRIGGER update_brokers_updated_at
  BEFORE UPDATE ON public.brokers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_properties_updated_at ON public.properties;
CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_leads_updated_at ON public.leads;
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_realtors_updated_at ON public.realtors;
CREATE TRIGGER update_realtors_updated_at
  BEFORE UPDATE ON public.realtors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_social_links_updated_at ON public.social_links;
CREATE TRIGGER update_social_links_updated_at
  BEFORE UPDATE ON public.social_links
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();