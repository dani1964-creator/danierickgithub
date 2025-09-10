-- Add audit logging for leads access
-- Create the audit trigger for leads (only for authenticated access)
DROP TRIGGER IF EXISTS audit_lead_access_trigger ON public.leads;

CREATE TRIGGER audit_lead_access_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.audit_lead_access();