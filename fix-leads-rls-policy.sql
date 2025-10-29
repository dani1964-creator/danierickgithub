-- Fix leads RLS policy to allow anonymous public form submissions
-- The issue is that the current policy is too restrictive

-- Drop the current restrictive policy
DROP POLICY IF EXISTS "Public can insert leads with enhanced rate limit" ON public.leads;

-- Create a new policy that allows public anonymous insertions with rate limiting
CREATE POLICY "Allow public lead submissions with rate limiting" 
ON public.leads 
FOR INSERT 
TO public
WITH CHECK (check_lead_rate_limit_enhanced(NULL::inet, email));

-- Also ensure the table has the correct RLS setup
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Add a backup policy for anon role as well
CREATE POLICY "Allow anon lead submissions with rate limiting" 
ON public.leads 
FOR INSERT 
TO anon
WITH CHECK (check_lead_rate_limit_enhanced(NULL::inet, email));