-- Update leads security with corrected rate limiting policy
-- Drop existing audit trigger if it exists
DROP TRIGGER IF EXISTS audit_lead_access_trigger ON public.leads;

-- Create the audit trigger for leads (only for authenticated access)
CREATE TRIGGER audit_lead_access_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.audit_lead_access();

-- Update the leads RLS policy to use the original rate limiting function
DROP POLICY IF EXISTS "Public can insert leads with basic rate limit" ON public.leads;

CREATE POLICY "Public can insert leads with enhanced rate limit" 
ON public.leads 
FOR INSERT 
TO public
WITH CHECK (check_lead_rate_limit(NULL::inet));