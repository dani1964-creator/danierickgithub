-- MIGRAÇÃO: Corrigir políticas RLS para formulário de leads
-- Arquivo: /workspaces/danierickgithub/supabase/migrations/20251027204800_fix_leads_form_rls.sql

-- Remover políticas restritivas existentes
DROP POLICY IF EXISTS "Public can insert leads with enhanced rate limit" ON public.leads;
DROP POLICY IF EXISTS "Allow public lead submissions" ON public.leads;
DROP POLICY IF EXISTS "Allow anon lead submissions" ON public.leads;

-- Criar políticas que permitam inserção anônima com rate limiting adequado
CREATE POLICY "Allow public lead submissions with rate limit" 
ON public.leads 
FOR INSERT 
TO public 
WITH CHECK (check_lead_rate_limit_enhanced(NULL::inet, email));

CREATE POLICY "Allow anon lead submissions with rate limit" 
ON public.leads 
FOR INSERT 
TO anon 
WITH CHECK (check_lead_rate_limit_enhanced(NULL::inet, email));

-- Garantir que RLS está habilitado
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;