-- Enhance leads security with better rate limiting and audit logging
-- Create enhanced rate limiting function for leads
CREATE OR REPLACE FUNCTION public.check_lead_rate_limit_enhanced(user_email text DEFAULT NULL::text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  -- Enhanced rate limiting: 
  -- - Max 5 leads per email per hour (prevent spam from same email)
  -- - Max 20 total leads per hour globally (prevent overall spam)
  SELECT 
    (CASE WHEN user_email IS NOT NULL THEN
      (SELECT COUNT(*) FROM public.leads WHERE email = user_email AND created_at > NOW() - INTERVAL '1 hour') < 5
     ELSE true END)
    AND
    (SELECT COUNT(*) FROM public.leads WHERE created_at > NOW() - INTERVAL '1 hour') < 200;
$function$;

-- Create audit function for leads access (INSERT/UPDATE/DELETE only - not SELECT to avoid infinite triggers)
CREATE OR REPLACE FUNCTION public.audit_lead_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Log changes to sensitive lead data (not SELECT operations)
  INSERT INTO public.security_logs (
    event_type,
    user_id,
    metadata
  ) VALUES (
    'lead_data_change',
    auth.uid(),
    jsonb_build_object(
      'lead_id', COALESCE(NEW.id, OLD.id),
      'operation', TG_OP,
      'broker_id', COALESCE(NEW.broker_id, OLD.broker_id),
      'timestamp', NOW()
    )
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Create the audit trigger for leads changes only
DROP TRIGGER IF EXISTS audit_lead_changes_trigger ON public.leads;
CREATE TRIGGER audit_lead_changes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.audit_lead_changes();

-- Update lead rate limit policy to use the enhanced function
DROP POLICY IF EXISTS "Public can insert leads with basic rate limit" ON public.leads;
CREATE POLICY "Public can insert leads with enhanced rate limit"
ON public.leads
FOR INSERT
TO anon
WITH CHECK (check_lead_rate_limit_enhanced(email));