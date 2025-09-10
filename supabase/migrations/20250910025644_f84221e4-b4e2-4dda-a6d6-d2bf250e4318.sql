-- Fix search_path issues in database functions
-- Update all functions to have proper search_path

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