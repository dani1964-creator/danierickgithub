# Requisitos Supabase para Painel Super Admin

## Tabelas Necessárias

### 1. `brokers` (Principal)
```sql
CREATE TABLE public.brokers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name text NOT NULL,
  display_name text,
  email text UNIQUE NOT NULL,
  website_slug text UNIQUE NOT NULL,
  phone text,
  whatsapp_number text,
  contact_email text,
  is_active boolean DEFAULT true,
  plan_type text DEFAULT 'basic',
  max_properties integer DEFAULT 50,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  -- Campos de personalização
  primary_color text DEFAULT '#1e40af',
  secondary_color text DEFAULT '#64748b',
  -- Campos SEO
  site_title text,
  site_description text,
  -- Outros campos necessários...
  subdomain text,
  canonical_prefer_custom_domain boolean DEFAULT false
);
```

### 2. `properties` (Relacionada)
```sql
CREATE TABLE public.properties (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  broker_id uuid REFERENCES public.brokers(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  price numeric,
  property_type text NOT NULL,
  transaction_type text NOT NULL,
  address text,
  neighborhood text,
  city text,
  uf text,
  bedrooms integer,
  bathrooms integer,
  area_m2 numeric,
  parking_spaces integer DEFAULT 0,
  is_featured boolean DEFAULT false,
  is_active boolean DEFAULT true,
  main_image_url text,
  images text[],
  features text[],
  status text DEFAULT 'available',
  slug text UNIQUE NOT NULL,
  property_code text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### 3. View ou Função para Contagem de Propriedades
```sql
-- View para incluir contagem de propriedades por broker
CREATE VIEW brokers_with_counts AS
SELECT 
  b.*,
  COALESCE(p.properties_count, 0) as properties_count
FROM brokers b
LEFT JOIN (
  SELECT 
    broker_id,
    COUNT(*) as properties_count
  FROM properties
  WHERE is_active = true
  GROUP BY broker_id
) p ON b.id = p.broker_id;
```

## Row Level Security (RLS) Necessário

### Políticas para `brokers`

```sql
-- Ativar RLS
ALTER TABLE public.brokers ENABLE ROW LEVEL SECURITY;

-- 1. Super Admin pode ver todos (via service role)
-- Esta política permite acesso via service role key
CREATE POLICY "Service role can manage all brokers"
ON public.brokers
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 2. Brokers podem ver apenas próprio perfil
CREATE POLICY "Brokers can view own profile"
ON public.brokers
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 3. Brokers podem atualizar próprio perfil
CREATE POLICY "Brokers can update own profile"
ON public.brokers
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 4. Acesso público limitado para sites (apenas campos seguros)
CREATE POLICY "Public can view active broker sites"
ON public.brokers
FOR SELECT
TO anon, authenticated
USING (
  is_active = true 
  AND (website_slug IS NOT NULL OR subdomain IS NOT NULL)
);
```

### Políticas para `properties`

```sql
-- Ativar RLS
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- 1. Service role acessa tudo
CREATE POLICY "Service role can manage all properties"
ON public.properties
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 2. Brokers gerenciam próprias propriedades
CREATE POLICY "Brokers can manage own properties"
ON public.properties
FOR ALL
TO authenticated
USING (
  broker_id IN (
    SELECT id FROM public.brokers WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  broker_id IN (
    SELECT id FROM public.brokers WHERE user_id = auth.uid()
  )
);

-- 3. Acesso público para propriedades ativas
CREATE POLICY "Public can view active properties"
ON public.properties
FOR SELECT
TO anon, authenticated
USING (
  is_active = true 
  AND status = 'available'
  AND broker_id IN (
    SELECT id FROM public.brokers WHERE is_active = true
  )
);
```

## Edge Functions Necessárias

### `admin-brokers` Function
Localização: `supabase/functions/admin-brokers/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, brokerId, newStatus, email, password } = await req.json()

    // Verificar credenciais super admin
    const SUPER_ADMIN_EMAIL = Deno.env.get('VITE_SA_EMAIL')
    const SUPER_ADMIN_PASSWORD = Deno.env.get('VITE_SA_PASSWORD')

    if (email !== SUPER_ADMIN_EMAIL || password !== SUPER_ADMIN_PASSWORD) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    switch (action) {
      case 'toggle':
        const { error: toggleError } = await supabaseClient
          .from('brokers')
          .update({ is_active: newStatus })
          .eq('id', brokerId)

        if (toggleError) throw toggleError
        break

      case 'delete':
        const { error: deleteError } = await supabaseClient
          .from('brokers')
          .delete()
          .eq('id', brokerId)

        if (deleteError) throw deleteError
        break
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

## Variáveis de Ambiente Necessárias

### No Supabase Dashboard -> Settings -> Edge Functions -> Environment Variables:
```
VITE_SA_EMAIL=erickjq123@gmail.com
VITE_SA_PASSWORD=Danis0133.
```

### No projeto local (.env):
```
VITE_SA_EMAIL=erickjq123@gmail.com
VITE_SA_PASSWORD=Danis0133.
SUPABASE_SERVICE_ROLE_KEY=seu_service_role_key_aqui
```

## Funcionalidades do SuperAdmin

### 1. **Visualizar Imobiliárias**
- Lista todas as imobiliárias com paginação
- Mostra status (ativa/inativa), plano, quantidade de imóveis
- Filtros e ordenação

### 2. **Criar Nova Imobiliária**
- Formulário para criar conta de usuário + registro broker
- Gera automaticamente website_slug baseado no business_name
- Envia email de confirmação

### 3. **Ativar/Desativar Imobiliárias**
- Toggle de status via Edge Function
- Afeta visibilidade do site público

### 4. **Excluir Imobiliárias**
- Exclusão completa via Edge Function
- Remove usuário da auth e registro do broker
- Cascade delete para propriedades

### 5. **Estatísticas**
- Total de imobiliárias
- Imobiliárias ativas
- Total de imóveis no sistema

## Verificações Recomendadas no Supabase

### 1. Verificar Tabelas
```sql
-- No SQL Editor do Supabase
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('brokers', 'properties');
```

### 2. Verificar RLS Ativo
```sql
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('brokers', 'properties');
```

### 3. Verificar Políticas
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';
```

### 4. Testar Service Role
```sql
-- Via service role key, deve retornar todos os brokers
SELECT id, business_name, email, is_active 
FROM brokers 
LIMIT 5;
```

### 5. Verificar Edge Function
No dashboard do Supabase:
- Ir em Edge Functions
- Verificar se `admin-brokers` existe
- Testar invocação
- Verificar logs de execução