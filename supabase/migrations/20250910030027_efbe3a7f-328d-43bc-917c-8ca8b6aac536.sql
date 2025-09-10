-- Create audit trigger for leads table and update rate limiting
-- Create the audit trigger for leads (only for authenticated access)
CREATE TRIGGER audit_lead_access_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.audit_lead_access();

-- Update the leads RLS policy to use enhanced rate limiting
DROP POLICY IF EXISTS "Public can insert leads with basic rate limit" ON public.leads;

CREATE POLICY "Public can insert leads with enhanced rate limit" 
ON public.leads 
FOR INSERT 
TO public
WITH CHECK (check_lead_rate_limit_enhanced(NULL::inet, NEW.email));

-- Ensure all validation triggers are properly set
CREATE OR REPLACE TRIGGER validate_lead_trigger
  BEFORE INSERT OR UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.validate_lead_input();

CREATE OR REPLACE TRIGGER validate_property_trigger
  BEFORE INSERT OR UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.validate_property_input();

CREATE OR REPLACE TRIGGER validate_broker_trigger
  BEFORE INSERT OR UPDATE ON public.brokers
  FOR EACH ROW EXECUTE FUNCTION public.validate_broker_input();

-- Ensure slug generation trigger is active
CREATE OR REPLACE TRIGGER set_property_slug_trigger
  BEFORE INSERT OR UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.set_property_slug();

-- Ensure timestamp update triggers are active
CREATE OR REPLACE TRIGGER update_brokers_updated_at
  BEFORE UPDATE ON public.brokers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_realtors_updated_at
  BEFORE UPDATE ON public.realtors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_social_links_updated_at
  BEFORE UPDATE ON public.social_links
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();