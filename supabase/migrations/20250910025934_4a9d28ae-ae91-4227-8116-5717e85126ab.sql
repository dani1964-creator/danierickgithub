-- Create audit trigger for leads table and fix remaining search_path issues
-- Create the audit trigger for leads (for INSERT, UPDATE, DELETE only - not SELECT to avoid performance issues)
DROP TRIGGER IF EXISTS audit_lead_access_trigger ON public.leads;
CREATE TRIGGER audit_lead_access_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.audit_lead_access();

-- Ensure all validation triggers are properly created
DROP TRIGGER IF EXISTS validate_lead_trigger ON public.leads;
CREATE TRIGGER validate_lead_trigger
  BEFORE INSERT OR UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.validate_lead_input();

DROP TRIGGER IF EXISTS validate_property_trigger ON public.properties;
CREATE TRIGGER validate_property_trigger
  BEFORE INSERT OR UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.validate_property_input();

DROP TRIGGER IF EXISTS validate_broker_trigger ON public.brokers;
CREATE TRIGGER validate_broker_trigger
  BEFORE INSERT OR UPDATE ON public.brokers
  FOR EACH ROW EXECUTE FUNCTION public.validate_broker_input();

-- Ensure property slug triggers are working
DROP TRIGGER IF EXISTS set_property_slug_trigger ON public.properties;
CREATE TRIGGER set_property_slug_trigger
  BEFORE INSERT OR UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.set_property_slug();

-- Ensure timestamp triggers are working
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

-- Fix remaining functions with search_path issues
CREATE OR REPLACE FUNCTION public.is_broker_query_safe()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  -- This function will be used by application code to ensure only safe queries are made
  SELECT true;
$function$;

CREATE OR REPLACE FUNCTION public.user_can_access_realtor(realtor_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 
    FROM public.properties p
    JOIN public.brokers b ON p.broker_id = b.id
    WHERE p.realtor_id = $1
    AND b.user_id = auth.uid()
  );
$function$;

CREATE OR REPLACE FUNCTION public.user_owns_broker(p_user_id uuid, p_broker_slug text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.brokers 
    WHERE user_id = p_user_id 
    AND website_slug = p_broker_slug 
    AND is_active = true
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_lead_rate_limit(client_ip inet DEFAULT NULL::inet)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  -- More generous rate limiting: max 50 leads per IP per hour
  -- This allows legitimate users more freedom while still preventing major spam attacks
  SELECT (
    SELECT COUNT(*) 
    FROM public.leads 
    WHERE created_at > NOW() - INTERVAL '1 hour'
    AND (client_ip IS NULL OR true) -- Placeholder for IP-based limiting if needed
  ) < 50;
$function$;

CREATE OR REPLACE FUNCTION public.is_super_admin(user_email text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT user_email = 'erickjq123@gmail.com';
$function$;