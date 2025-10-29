-- Remover política restritiva atual
DROP POLICY IF EXISTS "Public can insert leads with enhanced rate limit" ON public.leads;

-- Criar políticas permissivas para usuários públicos e anônimos
CREATE POLICY "Allow public lead submissions" 
ON public.leads 
FOR INSERT 
TO public 
WITH CHECK (true);

CREATE POLICY "Allow anon lead submissions" 
ON public.leads 
FOR INSERT 
TO anon 
WITH CHECK (true);
