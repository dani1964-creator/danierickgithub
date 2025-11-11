# 📋 INSTRUÇÕES SQL - BASEADO NA ESTRUTURA REAL DO SEU BANCO

## ⚠️ IMPORTANTE: Execute estes comandos UM POR VEZ no Supabase SQL Editor

### 🔍 **ETAPA 0: Verificação Prévia (Execute primeiro)**

```sql
-- Verificar estrutura atual do banco
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('brokers', 'properties', 'leads')
ORDER BY table_name;
```

```sql
-- Verificar se as colunas importantes já existem em brokers
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns 
WHERE table_name = 'brokers' 
AND column_name IN ('custom_domain', 'website_slug', 'is_active', 'plan_type', 'user_id')
ORDER BY column_name;
```

```sql
-- Verificar colunas em properties
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'properties' 
AND column_name IN ('is_featured', 'is_active', 'broker_id')
ORDER BY column_name;
```

### 🔧 **ETAPA 1: Completar Tabela Brokers (APENAS campos ausentes)**

**⚠️ IMPORTANTE: Baseado no types.ts, a maioria dos campos já existe. Execute APENAS se algum campo estiver ausente na verificação acima.**

```sql
-- Estas colunas já existem no seu banco (baseado no types.ts), mas caso alguma esteja ausente:
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
-- Verificar constraints existentes primeiro
SELECT conname, contype 
FROM pg_constraint 
WHERE conrelid = 'brokers'::regclass 
AND conname LIKE '%unique%';
```

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

### 📊 **ETAPA 3: Verificar Properties (campos já existem no types.ts)**

```sql
-- Estes campos já existem baseado no types.ts, mas verificando:
ALTER TABLE properties ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
```

```sql
ALTER TABLE properties ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
```

### 🗂️ **ETAPA 4: Criar Índices de Performance**

```sql
-- Índices para brokers (tenant identification)
CREATE INDEX IF NOT EXISTS idx_brokers_user_id ON brokers(user_id);
```

```sql
CREATE INDEX IF NOT EXISTS idx_brokers_custom_domain ON brokers(custom_domain) WHERE custom_domain IS NOT NULL;
```

```sql
CREATE INDEX IF NOT EXISTS idx_brokers_website_slug ON brokers(website_slug) WHERE website_slug IS NOT NULL;
```

```sql
CREATE INDEX IF NOT EXISTS idx_brokers_is_active ON brokers(is_active);
```

```sql
-- Índices para properties (tenant isolation)
CREATE INDEX IF NOT EXISTS idx_properties_broker_id ON properties(broker_id);
```

```sql
CREATE INDEX IF NOT EXISTS idx_properties_broker_status ON properties(broker_id, status);
```

```sql
CREATE INDEX IF NOT EXISTS idx_properties_broker_active ON properties(broker_id, is_active) WHERE is_active = true;
```

```sql
CREATE INDEX IF NOT EXISTS idx_properties_featured ON properties(broker_id, is_featured, created_at) WHERE is_featured = true;
```

```sql
-- Índices para leads (tenant isolation)
CREATE INDEX IF NOT EXISTS idx_leads_broker_id ON leads(broker_id);
```

```sql
CREATE INDEX IF NOT EXISTS idx_leads_broker_created ON leads(broker_id, created_at DESC);
```

```sql
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(broker_id, status);
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
-- Policy para properties - isolamento por tenant (CORRIGIDA para sua estrutura)
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
-- Policy para properties públicas (acesso de leitura para sites)
DROP POLICY IF EXISTS "properties_public_access" ON properties;
CREATE POLICY "properties_public_access" ON properties
    FOR SELECT USING (
        COALESCE(is_active, true) = true
    );
```

```sql
-- Policy para leads - isolamento por tenant (CORRIGIDA)
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
-- Policy para criação pública de leads (formulários de contato)
DROP POLICY IF EXISTS "leads_public_insert" ON leads;
CREATE POLICY "leads_public_insert" ON leads
    FOR INSERT WITH CHECK (true);
```

### 🔧 **ETAPA 6: Funções Utilitárias (as que já existem no seu projeto)**

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

**As funções `get_broker_by_domain_or_slug` e `get_properties_by_domain_or_slug` já existem no seu projeto baseado no types.ts - NÃO precisa recriar.**

### 🚀 **ETAPA 7: Teste de Exemplo (Opcional)**

```sql
-- APENAS se quiser inserir um broker de teste (ajuste os dados)
INSERT INTO brokers (
    business_name,
    email,
    user_id,
    custom_domain,
    website_slug,
    is_active,
    plan_type
) VALUES (
    'Imobiliária Teste',
    'teste@exemplo.com.br',
    auth.uid(), -- Use seu user_id real aqui
    'teste.imob.com.br',
    'teste',
    true,
    'basic'
) ON CONFLICT (custom_domain) DO NOTHING;
```

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
-- Verificar índices criados
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('brokers', 'properties', 'leads')
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
```

```sql
-- Testar função existente (substitua 'seu-slug' por um slug real)
SELECT business_name, website_slug, custom_domain 
FROM get_broker_by_domain_or_slug(NULL, 'seu-slug') 
LIMIT 1;
```

---

## 🚨 **SOBRE RE-EXECUÇÃO DOS COMANDOS**

**✅ É SEGURO re-executar** a maioria dos comandos porque:

1. **`ALTER TABLE ... IF NOT EXISTS`** - só adiciona se não existir
2. **`CREATE INDEX IF NOT EXISTS`** - só cria se não existir  
3. **`DROP POLICY IF EXISTS`** - remove policy antiga antes de criar nova
4. **Blocos DO $$** - verificam se constraint já existe

**⚠️ CUIDADO apenas com:**
- Inserção de dados de exemplo (pode duplicar)
- Se você já tem dados importantes nas tabelas

**✅ COMANDOS SEGUROS para re-execução:**
- Todos os ALTER TABLE IF NOT EXISTS
- Todos os CREATE INDEX IF NOT EXISTS  
- Todas as policies (são recriadas)
- Todas as funções (são substituídas)

---

## 📝 **DIFERENÇAS DA VERSÃO ANTERIOR**

1. **❌ Removido:** Referências à tabela `profiles` (não existe)
2. **✅ Corrigido:** Policies baseadas em `brokers.user_id = auth.uid()`
3. **✅ Baseado:** Na estrutura real do types.ts
4. **✅ Seguro:** Para re-execução com verificações
5. **✅ Compatível:** Com as funções que já existem no projeto