# 📋 INSTRUÇÕES SQL - BASEADO NA ESTRUTURA REAL DO SEU BANCO

## ⚠️ IMPORTANTE: Execute estes comandos UM POR VEZ no Supabase SQL Editor

### � **ETAPA 0: Verificação Prévia (Execute primeiro)**

```sql
-- Verificar se as colunas importantes já existem em brokers
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns 
WHERE table_name = 'brokers' 
AND column_name IN ('custom_domain', 'website_slug', 'is_active', 'plan_type', 'user_id')
ORDER BY column_name;
```

### 🔧 **ETAPA 1: Completar Tabela Brokers (APENAS campos ausentes)**

**⚠️ IMPORTANTE: Baseado no types.ts, a maioria dos campos já existe. Execute APENAS se algum campo estiver ausente.**

```sql
-- Estas colunas já existem no seu banco, mas caso alguma esteja ausente:
ALTER TABLE brokers ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
```

```sql
ALTER TABLE brokers ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'basic';
```

```sql
ALTER TABLE brokers ADD COLUMN IF NOT EXISTS website_slug TEXT;
```

```sql
ALTER TABLE brokers ADD COLUMN IF NOT EXISTS custom_domain TEXT;
```

### 🔒 **ETAPA 2: Adicionar Constraints UNIQUE (se não existirem)**

```sql
-- Adicionar constraint para custom_domain se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'brokers_custom_domain_unique') THEN
        ALTER TABLE brokers ADD CONSTRAINT brokers_custom_domain_unique UNIQUE (custom_domain);
    END IF;
END $$;
```

```sql
-- Adicionar constraint para website_slug se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'brokers_website_slug_unique') THEN
        ALTER TABLE brokers ADD CONSTRAINT brokers_website_slug_unique UNIQUE (website_slug);
    END IF;
END $$;
```

### 📊 **ETAPA 3: Verificar Properties (campos já existem)**

```sql
-- Estes campos já existem baseado no types.ts:
ALTER TABLE properties ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
```

```sql
ALTER TABLE properties ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
```

### 🗂️ **ETAPA 4: Criar Índices de Performance**

```sql
-- Índices para brokers
CREATE INDEX IF NOT EXISTS idx_brokers_user_id ON brokers(user_id);
```

```sql
CREATE INDEX IF NOT EXISTS idx_brokers_custom_domain ON brokers(custom_domain) WHERE custom_domain IS NOT NULL;
```

```sql
CREATE INDEX IF NOT EXISTS idx_brokers_website_slug ON brokers(website_slug) WHERE website_slug IS NOT NULL;
```

```sql
-- Índices para properties
CREATE INDEX IF NOT EXISTS idx_properties_broker_id ON properties(broker_id);
```

```sql
CREATE INDEX IF NOT EXISTS idx_properties_broker_active ON properties(broker_id, is_active) WHERE is_active = true;
```

```sql
CREATE INDEX IF NOT EXISTS idx_properties_featured ON properties(broker_id, is_featured, created_at) WHERE is_featured = true;
```

```sql
-- Índices para leads
CREATE INDEX IF NOT EXISTS idx_leads_broker_id ON leads(broker_id);
```

```sql
CREATE INDEX IF NOT EXISTS idx_leads_broker_created ON leads(broker_id, created_at DESC);
```

### 🔐 **ETAPA 5: Row Level Security (RLS) - BASEADO NA ESTRUTURA REAL**

```sql
-- Habilitar RLS nas tabelas principais
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
```

```sql
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
```

```sql
-- Policy para properties - CORRIGIDA para sua estrutura real (sem profiles)
DROP POLICY IF EXISTS "properties_tenant_isolation" ON properties;
CREATE POLICY "properties_tenant_isolation" ON properties
    FOR ALL USING (
        auth.uid() IS NOT NULL AND 
        broker_id IN (
            SELECT id FROM brokers WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        auth.uid() IS NOT NULL AND 
        broker_id IN (
            SELECT id FROM brokers WHERE user_id = auth.uid()
        )
    );
```

```sql
-- Policy para properties públicas
DROP POLICY IF EXISTS "properties_public_access" ON properties;
CREATE POLICY "properties_public_access" ON properties
    FOR SELECT USING (
        COALESCE(is_active, true) = true
    );
```

```sql
-- Policy para leads - CORRIGIDA
DROP POLICY IF EXISTS "leads_tenant_isolation" ON leads;
CREATE POLICY "leads_tenant_isolation" ON leads
    FOR ALL USING (
        auth.uid() IS NOT NULL AND 
        broker_id IN (
            SELECT id FROM brokers WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        auth.uid() IS NOT NULL AND 
        broker_id IN (
            SELECT id FROM brokers WHERE user_id = auth.uid()
        )
    );
```

```sql
-- Policy para criação pública de leads
DROP POLICY IF EXISTS "leads_public_insert" ON leads;
CREATE POLICY "leads_public_insert" ON leads
    FOR INSERT WITH CHECK (true);
```

### 📊 **ETAPA 4: Adicionar Campos Necessários nas Tabelas**

```sql
-- Adicionar campos que podem estar faltando em properties
ALTER TABLE properties ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS leads_count INTEGER DEFAULT 0;

-- Adicionar campos em leads se necessário
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_source TEXT DEFAULT 'website';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS contacted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS follow_up_date DATE;
```

### 🔧 **ETAPA 5: Funções Utilitárias**

```sql
---

## ✅ **VERIFICAÇÃO FINAL**

```sql
-- Verificar se RLS está habilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('properties', 'leads', 'brokers')
ORDER BY tablename;
```

```sql
-- Testar função existente (substitua 'seu-slug' por um slug real)
SELECT business_name, website_slug, custom_domain 
FROM get_broker_by_domain_or_slug(NULL, 'seu-slug') 
LIMIT 1;
```

---

## 🚨 **RESPONDENDO SUA PERGUNTA SOBRE RE-EXECUÇÃO**

**✅ É TOTALMENTE SEGURO re-executar** os comandos porque:

1. **`ALTER TABLE ... IF NOT EXISTS`** - só adiciona se não existir
2. **`CREATE INDEX IF NOT EXISTS`** - só cria se não existir  
3. **`DROP POLICY IF EXISTS`** - remove policy antiga antes de criar nova
4. **Blocos `DO $$`** - verificam se constraint já existe

**✅ PODE EXECUTAR QUANTAS VEZES QUISER:**
- Todos os ALTER TABLE IF NOT EXISTS
- Todos os CREATE INDEX IF NOT EXISTS  
- Todas as policies (são recriadas seguramente)

**❌ O PROBLEMA ANTERIOR ERA:**
- Policies referenciavam tabela `profiles` que **não existe** no seu banco
- Era baseado em estrutura genérica, não na sua estrutura real

**✅ AGORA ESTÁ CORRETO:**
- Baseado na estrutura real do seu `types.ts`
- Policies usam `brokers.user_id = auth.uid()` (que existe)
- Seguro para re-execução
```

### 📈 **ETAPA 6: Funções de Estatísticas**

```sql
-- Função para incrementar visualizações de propriedade
CREATE OR REPLACE FUNCTION increment_property_views(property_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE properties 
    SET views_count = COALESCE(views_count, 0) + 1,
        updated_at = NOW()
    WHERE id = property_id;
END;
$$;
```

```sql
-- Função para buscar propriedades por domínio ou slug (VERSÃO CORRIGIDA - TESTADA)
CREATE OR REPLACE FUNCTION get_properties_by_domain_or_slug(
    domain_name TEXT DEFAULT NULL,
    slug_name TEXT DEFAULT NULL,
    property_limit INTEGER DEFAULT 50,
    property_offset INTEGER DEFAULT 0
)
RETURNS SETOF properties
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    target_broker_id UUID;
BEGIN
    -- Encontrar o broker_id baseado no domínio ou slug
    SELECT id INTO target_broker_id
    FROM brokers b
    WHERE (
        (domain_name IS NOT NULL AND b.custom_domain = domain_name) OR
        (slug_name IS NOT NULL AND b.website_slug = slug_name)
    )
    AND COALESCE(b.is_active, true) = true
    LIMIT 1;
    
    -- Se não encontrou broker, retornar vazio
    IF target_broker_id IS NULL THEN
        RETURN;
    END IF;
    
    -- Retornar propriedades do broker
    RETURN QUERY
    SELECT p.*
    FROM properties p
    WHERE p.broker_id = target_broker_id
      AND COALESCE(p.is_active, true) = true
    ORDER BY p.created_at DESC
    LIMIT property_limit
    OFFSET property_offset;
END;
$$;
```

**💡 ALTERNATIVA SIMPLES (se a versão acima ainda der erro):**

```sql
-- Versão simplificada usando SQL puro
CREATE OR REPLACE FUNCTION get_properties_by_domain_or_slug_simple(
    domain_name TEXT,
    slug_name TEXT
)
RETURNS TABLE(
    id UUID,
    title TEXT,
    price NUMERIC,
    broker_id UUID,
    created_at TIMESTAMPTZ
)
LANGUAGE sql
AS $$
    SELECT p.id, p.title, p.price, p.broker_id, p.created_at
    FROM properties p
    JOIN brokers b ON p.broker_id = b.id
    WHERE (b.custom_domain = domain_name OR b.website_slug = slug_name)
    ORDER BY p.created_at DESC
    LIMIT 50;
$$;
```

### 🚀 **ETAPA 7: Dados de Exemplo (Opcional - Execute apenas se necessário)**

```sql
-- ATENÇÃO: Ajuste os dados conforme sua necessidade antes de executar
INSERT INTO brokers (
    name,
    business_name,
    email,
    custom_domain,
    subdomain,
    website_slug,
    theme_settings,
    site_title,
    site_description,
    is_active,
    plan_type,
    status
) VALUES (
    'Imobiliária Exemplo',
    'Imobiliária Exemplo Ltda',
    'contato@exemplo.com',
    'exemplo.com.br',
    'exemplo',
    'exemplo',
    '{"primary_color": "#3B82F6", "secondary_color": "#EF4444"}',
    'Imobiliária Exemplo - Seu imóvel ideal',
    'Encontre casas, apartamentos e terrenos na Imobiliária Exemplo.',
    true,
    'premium',
    'active'
) ON CONFLICT (custom_domain) DO NOTHING;
```

---

## ✅ **VERIFICAÇÃO DE SUCESSO**

Após executar todos os comandos, execute estes testes:

```sql
-- Verificar se as colunas foram adicionadas
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'brokers' 
AND column_name IN ('custom_domain', 'website_slug', 'subdomain', 'theme_settings')
ORDER BY column_name;
```

```sql
-- Verificar se RLS está habilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('properties', 'leads', 'brokers')
ORDER BY tablename;
```

```sql
-- Testar função de busca por domínio (substitua 'exemplo' pelo slug real)
SELECT * FROM get_broker_by_domain_or_slug(NULL, 'exemplo');
```

```sql
-- Testar função de propriedades (substitua 'exemplo' pelo slug real)
SELECT COUNT(*) as total_properties 
FROM get_properties_by_domain_or_slug(NULL, 'exemplo');
```

## 🚨 **IMPORTANTE - LEIA ANTES DE EXECUTAR**

### ✅ **Checklist de Execução:**
1. **Execute APENAS UM comando por vez** no Supabase SQL Editor
2. **Aguarde confirmação** de sucesso antes do próximo comando  
3. **Faça backup** da base de dados antes de executar em produção
4. **Teste em ambiente de desenvolvimento** primeiro

### ⚠️ **Tratamento de Erros Comuns:**

Se aparecer erro **"column already exists"**:
- Pule o comando específico, a coluna já existe
- Continue com os próximos comandos

Se aparecer erro **"relation does not exist"**:
- Verifique se as tabelas `brokers`, `properties` e `leads` existem
- Crie as tabelas básicas primeiro se necessário

Se aparecer erro **"constraint already exists"**:
- O constraint já foi criado, continue normalmente

### 🔍 **Verificação Prévia (Execute primeiro):**

```sql
-- Verificar se as tabelas principais existem
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('brokers', 'properties', 'leads')
ORDER BY table_name;
```