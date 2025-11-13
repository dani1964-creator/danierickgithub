-- Fix linter ERROR 0010: Security Definer View  
-- Ensure the view runs with invoker privileges so RLS and permissions of the querying user apply
-- Only apply if the view exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'lead_counts_by_status' AND table_schema = 'public') THEN
    ALTER VIEW public.lead_counts_by_status SET (security_invoker = on);
  END IF;
END $$;