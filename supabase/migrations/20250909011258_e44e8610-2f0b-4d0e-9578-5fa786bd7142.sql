-- Fix linter ERROR 0010: Security Definer View
-- Ensure the view runs with invoker privileges so RLS and permissions of the querying user apply
ALTER VIEW public.lead_counts_by_status SET (security_invoker = on);