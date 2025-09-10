-- Fix the trigger syntax error and implement proper security improvements
-- Remove the invalid SELECT trigger and implement proper audit logging

-- First, fix the search_path for remaining functions that need it
CREATE OR REPLACE FUNCTION public.audit_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.audit_logs (
    table_name,
    operation,
    user_id,
    record_id,
    old_data,
    new_data
  ) VALUES (
    TG_TABLE_NAME,
    TG_OP,
    auth.uid(),
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Create a proper audit function for leads (without SELECT trigger)
CREATE OR REPLACE FUNCTION public.audit_lead_operation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Log lead operations for security monitoring
  INSERT INTO public.security_logs (
    event_type,
    user_id,
    metadata
  ) VALUES (
    'lead_operation',
    auth.uid(),
    jsonb_build_object(
      'operation', TG_OP,
      'lead_id', COALESCE(NEW.id, OLD.id),
      'broker_id', COALESCE(NEW.broker_id, OLD.broker_id),
      'timestamp', NOW()
    )
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Improve the lead rate limiting function
CREATE OR REPLACE FUNCTION public.check_lead_rate_limit_enhanced(user_email text DEFAULT NULL::text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  -- Enhanced rate limiting for leads:
  -- Max 5 leads per email per hour (prevent spam from same email)
  SELECT 
    CASE 
      WHEN user_email IS NULL THEN TRUE
      ELSE (SELECT COUNT(*) FROM public.leads WHERE email = user_email AND created_at > NOW() - INTERVAL '1 hour') < 5
    END;
$function$;

-- Update the existing lead rate limit function to use enhanced version
CREATE OR REPLACE FUNCTION public.check_lead_rate_limit(client_ip inet DEFAULT NULL::inet)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  -- Generous rate limiting: max 50 leads per hour total
  SELECT (
    SELECT COUNT(*) 
    FROM public.leads 
    WHERE created_at > NOW() - INTERVAL '1 hour'
  ) < 50;
$function$;

-- Create proper triggers (removing the invalid SELECT trigger)
DROP TRIGGER IF EXISTS audit_lead_access_trigger ON public.leads;
CREATE TRIGGER audit_lead_operation_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.audit_lead_operation();

-- Ensure all validation triggers are properly set up
DROP TRIGGER IF EXISTS validate_lead_trigger ON public.leads;
CREATE TRIGGER validate_lead_trigger
  BEFORE INSERT OR UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.validate_lead_input();

-- Add audit triggers for other sensitive tables
DROP TRIGGER IF EXISTS audit_brokers_trigger ON public.brokers;
CREATE TRIGGER audit_brokers_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.brokers
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

DROP TRIGGER IF EXISTS audit_properties_trigger ON public.properties;
CREATE TRIGGER audit_properties_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

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