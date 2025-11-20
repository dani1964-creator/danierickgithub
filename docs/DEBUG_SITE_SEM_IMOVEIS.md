# 🐛 DEBUG: Site Não Mostra Imóveis

## Status Atual

✅ **Sistema de categorias implementado** (8 arquivos modificados)
✅ **Propriedades existem no banco** (5 propriedades em 3 brokers)
❌ **Site não renderiza imóveis** (nem categorias nem fallback)
❌ **Migration não aplicada** (tabelas não existem)
❌ **Dependência não instalada** (`@hello-pangea/dnd`)

---

## 🔍 Diagnóstico Realizado

### Teste 1: Propriedades no Banco ✅

```bash
cd /workspaces/danierickgithub/frontend && node check-properties-load.cjs
```

**Resultado:**
- 6 brokers ativos
- 5 propriedades ativas distribuídas:
  - **terceira imob** (slug: `home`): 1 imóvel destaque
  - **Imobiliária Soares** (slug: `deps`): 1 imóvel destaque
  - **R&F imobiliaria** (slug: `rfimobiliaria`): 3 imóveis (2 destaques + 1 normal)

### Teste 2: Query do public-site.tsx ❌

A query retornou **0 propriedades** para o broker "AugustusEmperor" (slug: `teste-sync`), que não tem imóveis.

**Hipótese:** O site está carregando o broker errado OU usando hostname/slug incorreto.

---

## 🚨 Ações Necessárias (em ordem)

### 1. Verificar qual broker está sendo carregado

**Como testar:**
1. Acesse o site público (ex: `https://rfimobiliaria.adminimobiliaria.site`)
2. Abra o Console do navegador (F12 → Console)
3. Procure por logs do tipo:
   ```
   📊 Properties state updated: {total: 0, featured: 0, regular: 0, ...}
   ```
4. Verifique também:
   ```
   Fetching broker data - Custom domain: false, Slug: rfimobiliaria
   Broker data from domain-aware hook: {...}
   ✅ Properties fetched from database: {count: 3, ...}
   ```

**Resultados Esperados:**
- Se `count: 0` → Problema na query `getPropertiesByDomainOrSlug`
- Se `count: 3` mas `total: 0` → Problema no `usePropertyFilters`
- Se nem log aparecer → Erro no `fetchBrokerData` (try/catch silencioso)

### 2. Aplicar Migration SQL no Supabase

**Passos:**
1. Acesse o Supabase Dashboard: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **SQL Editor** (ícone de código no menu lateral)
4. Clique em **New Query**
5. Copie o conteúdo de `/workspaces/danierickgithub/scripts/create-property-categories-system.sql`
6. Cole no editor e clique em **Run**
7. Verifique se aparece "Success. No rows returned"

**Verificação:**
```sql
-- Execute no SQL Editor para confirmar:
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('property_categories', 'property_category_assignments');
```

Deve retornar 2 linhas.

### 3. Instalar Dependência do Drag & Drop

```bash
cd /workspaces/danierickgithub/frontend
npm install @hello-pangea/dnd
```

Isso resolve os 20 erros de TypeScript relacionados ao painel de categorias.

### 4. Regenerar Tipos do Supabase (após migration)

```bash
cd /workspaces/danierickgithub/frontend
npx supabase gen types typescript --project-id <SEU_PROJECT_ID> > integrations/supabase/types.ts
```

Depois, **remova os type castings** adicionados (`as any`, `@ts-ignore`).

---

## 🧪 Testes de Validação

### Teste A: Site Público Mostra Imóveis

1. Acesse: `https://rfimobiliaria.adminimobiliaria.site`
2. Deve mostrar:
   - **Imóveis em Destaque** (2 imóveis)
   - **Todos os Imóveis** (3 imóveis total)

### Teste B: Painel de Categorias Funciona

1. Faça login no painel admin
2. Acesse: `/painel/categorias`
3. Deve mostrar:
   - Lista de categorias padrão ("Destaques", "Lançamentos")
   - Botão "Nova Categoria"
   - Drag & drop funcionando

### Teste C: Formulários Add/Edit Imóvel

1. Vá em `/painel/imoveis`
2. Clique em "Novo Imóvel"
3. Deve aparecer:
   - Seção "Categorias" com multi-select
   - Botões com cores das categorias

---

## 📊 Logs Adicionados para Debug

**public-site.tsx (linha 239):**
```typescript
React.useEffect(() => {
  logger.info('📊 Properties state updated:', {
    total: properties.length,
    featured: featuredProperties.length,
    regular: regularProperties.length,
    useDynamicCategories,
    categoriesCount: categoriesWithProperties.length
  });
}, [properties, featuredProperties, regularProperties, ...]);
```

**public-site.tsx (linha 316):**
```typescript
logger.warn('⚠️ Categories system not migrated yet, using legacy sections:', error);
```

Esses logs ajudam a identificar:
- Se `properties` está vazio (problema na query)
- Se `featuredProperties` está vazio mas `properties` não (problema no filtro)
- Se sistema de categorias foi tentado ou pulado

---

## 🔧 Próximos Passos

1. **Execute o Teste 1** (verificar logs no browser)
2. **Aplique a migration** (passo 2)
3. **Instale a dependência** (passo 3)
4. **Reporte os resultados** aqui

Se os logs mostrarem que `properties` está vazio, precisarei investigar a função `getPropertiesByDomainOrSlug` mais profundamente.

---

## 📝 Notas Técnicas

- **Broker sem slug:** O broker "erickimobiteste1" tem `slug: null` → não pode ser acessado
- **Hostname resolution:** O código extrai slug do hostname se não vier na URL
- **Cache:** Sistema tem cache de broker (60s TTL) → pode causar delay em mudanças
- **RLS:** Todas as queries respeitam Row Level Security → verificar policies se necessário

