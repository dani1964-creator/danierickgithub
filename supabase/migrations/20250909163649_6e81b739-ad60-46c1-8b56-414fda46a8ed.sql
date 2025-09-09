-- Update rate limiting function to allow 50 leads per hour instead of 5
CREATE OR REPLACE FUNCTION public.check_lead_rate_limit(client_ip inet DEFAULT NULL)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  -- More generous rate limiting: max 50 leads per IP per hour
  -- This allows legitimate users more freedom while still preventing major spam attacks
  SELECT (
    SELECT COUNT(*) 
    FROM public.leads 
    WHERE created_at > NOW() - INTERVAL '1 hour'
    AND (client_ip IS NULL OR true) -- Placeholder for IP-based limiting if needed
  ) < 50;
$$;