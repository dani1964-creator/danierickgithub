-- Update the leads RLS policy to use enhanced rate limiting with correct syntax
-- Drop existing policy and create new one
DROP POLICY IF EXISTS "Public can insert leads with basic rate limit" ON public.leads;

-- Create new policy with correct syntax for anonymous users
CREATE POLICY "Public can insert leads with enhanced rate limit" 
ON public.leads 
FOR INSERT 
TO anon
WITH CHECK (check_lead_rate_limit_enhanced(NULL::inet, email));