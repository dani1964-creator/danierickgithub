# 🎯 Sistema de Categorias Personalizadas - Implementação

## ✅ O Que Foi Implementado

### 1. **Banco de Dados** (`scripts/create-property-categories-system.sql`)

Tabelas criadas:
- **`property_categories`**: Categorias customizáveis por imobiliária
  - `name`, `slug`, `description`
  - `display_order` (ordem de exibição controlável)
  - `is_active`, `show_on_homepage`
  - `color`, `icon` (personalização visual)
  
- **`property_category_assignments`**: Many-to-Many (imóvel ↔ categorias)
  - Um imóvel pode estar em múltiplas categorias
  - Broker pode organizar imóveis livremente

**Functions SQL:**
- `get_broker_categories_with_counts()` - Lista categorias com nº de imóveis
- `get_category_properties()` - Busca imóveis de uma categoria específica

**RLS (Row Level Security):**
- Broker vê apenas suas categorias
- Público vê apenas categorias ativas

**Migração Automática:**
- Cria 2 categorias padrão para brokers existentes:
  - "Imóveis em Destaque" (slug: `destaque`)
  - "Todos os Imóveis" (slug: `todos`)
- Migra imóveis com `is_featured=true` para categoria "Destaque"

---

### 2. **Painel de Gerenciamento** (`frontend/pages/painel/categorias.tsx`)

#### Funcionalidades:

✅ **CRUD Completo:**
- Criar nova categoria (nome, descrição, ícone, cor)
- Editar categoria existente
- Excluir categoria (imóveis não são excluídos)
- Ativar/desativar categoria

✅ **Reordenação Drag & Drop:**
- Biblioteca: `@hello-pangea/dnd`
- Arraste categorias para reordenar
- Ordem salva automaticamente no banco

✅ **Personalização Visual:**
- 8 cores predefinidas (blue, red, green, orange, purple, cyan, yellow, slate)
- 7 ícones (Star, Home, TrendingUp, MapPin, DollarSign, Award, Sparkles)
- Badge colorido por categoria

✅ **Contagem de Imóveis:**
- Mostra quantos imóveis estão em cada categoria
- Atualiza automaticamente

✅ **Controles:**
- **Categoria ativa**: Se desativada, não aparece no site
- **Mostrar na home**: Controla visibilidade na página pública

---

### 3. **Formulário de Imóveis** (`frontend/components/properties/AddPropertyDialog.tsx`)

✅ **Seleção Multi-Categoria:**
- UI com botões coloridos (cor da categoria)
- Clique para selecionar/desselecionar
- Aviso se nenhuma categoria selecionada

✅ **Carregamento Automático:**
- Carrega categorias ativas do broker ao abrir formulário
- Ordenadas por `display_order`

✅ **Salvamento:**
- Ao criar imóvel, salva associações na tabela `property_category_assignments`
- Não falha se houver erro nas categorias (apenas loga)

---

## 🚧 O Que Falta Implementar

### 1. **EditPropertyDialog - Suporte a Categorias**
**Arquivo:** `frontend/components/properties/EditPropertyDialog.tsx`

**Tarefas:**
- [ ] Adicionar estado `categories: string[]`
- [ ] Carregar categorias atuais do imóvel ao abrir dialog
- [ ] Adicionar UI multi-select (igual ao AddPropertyDialog)
- [ ] Ao salvar, deletar associações antigas e criar novas

**Query para carregar categorias atuais:**
```typescript
const { data: currentCategories } = await supabase
  .from('property_category_assignments')
  .select('category_id')
  .eq('property_id', property.id);

const categoryIds = currentCategories?.map(c => c.category_id) || [];
```

**Lógica de salvamento:**
```typescript
// 1. Deletar associações antigas
await supabase
  .from('property_category_assignments')
  .delete()
  .eq('property_id', property.id);

// 2. Criar novas associações
const assignments = formData.categories.map(categoryId => ({
  property_id: property.id,
  category_id: categoryId,
  broker_id: brokerId,
}));

await supabase
  .from('property_category_assignments')
  .insert(assignments);
```

---

### 2. **Componente CategorySection (Home Pública)**
**Arquivo:** `frontend/components/home/CategorySection.tsx` (criar)

**Objetivo:** Renderizar uma seção de categoria dinamicamente

**Props:**
```typescript
interface CategorySectionProps {
  category: PropertyCategory;
  properties: Property[];
  brokerProfile: BrokerProfile | null;
  onContactLead: (propertyId: string) => void;
  onShare: (property: Property) => void;
  onFavorite: (propertyId: string) => void;
  isFavorited: (propertyId: string) => boolean;
  onImageClick: (images: string[], index: number, title: string) => void;
}
```

**Estrutura:**
```tsx
<section id={`categoria-${category.slug}`}>
  <BackgroundRenderer>
    <div className="content-container">
      <SectionHeader
        title={category.name}
        subtitle={category.description || ''}
      />
      
      {/* Mobile: Carousel */}
      <div className="block sm:hidden">
        {properties.map(property => (
          <PropertyCard property={property} ... />
        ))}
      </div>

      {/* Desktop: Grid */}
      <div className="hidden sm:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {properties.map(property => (
          <PropertyCard property={property} ... />
        ))}
      </div>
    </div>
  </BackgroundRenderer>
</section>
```

---

### 3. **Atualizar HomePage**
**Arquivo:** `frontend/pages/[slug]/index.tsx` ou similar

**Substituir:**
```tsx
// ❌ REMOVER (componentes estáticos)
<FeaturedProperties properties={featuredProps} ... />
<PropertiesGrid properties={regularProps} ... />
```

**Por:**
```tsx
// ✅ ADICIONAR (renderização dinâmica)
{categories.map((category) => {
  const categoryProperties = getPropertiesForCategory(category.id);
  
  return (
    <CategorySection
      key={category.id}
      category={category}
      properties={categoryProperties}
      brokerProfile={brokerProfile}
      onContactLead={handleContactLead}
      onShare={handleShare}
      onFavorite={handleFavorite}
      isFavorited={isFavorited}
      onImageClick={handleImageClick}
    />
  );
})}
```

**Carregar categorias e imóveis:**
```typescript
// Carregar categorias ativas (ordenadas)
const { data: categories } = await supabase
  .from('property_categories')
  .select('*')
  .eq('broker_id', brokerId)
  .eq('is_active', true)
  .eq('show_on_homepage', true)
  .order('display_order');

// Carregar imóveis de cada categoria
const propertiesByCategory = {};

for (const category of categories) {
  const { data: properties } = await supabase
    .rpc('get_category_properties', {
      p_broker_id: brokerId,
      p_category_slug: category.slug,
      p_limit: 12
    });
  
  propertiesByCategory[category.id] = properties || [];
}
```

---

### 4. **Instalação de Dependência**
**Necessário para Drag & Drop:**

```bash
npm install @hello-pangea/dnd
```

ou

```bash
yarn add @hello-pangea/dnd
```

---

## 📋 Passo a Passo para Finalizar

### Etapa 1: Aplicar Migration no Banco
```bash
# Copiar script para Supabase SQL Editor
cat scripts/create-property-categories-system.sql

# Ou executar via psql (se tiver acesso direto)
psql $DATABASE_URL -f scripts/create-property-categories-system.sql
```

### Etapa 2: Instalar Dependências
```bash
cd frontend
npm install @hello-pangea/dnd
```

### Etapa 3: Adicionar Link no Menu do Painel
**Arquivo:** `frontend/components/layouts/DashboardLayout.tsx` (ou similar)

```tsx
<Link href="/painel/categorias">
  <a className="nav-link">
    <Tag className="h-5 w-5" />
    Categorias
  </a>
</Link>
```

### Etapa 4: Completar EditPropertyDialog
- Copiar lógica de AddPropertyDialog
- Adicionar carregamento de categorias atuais
- Implementar update de associações

### Etapa 5: Criar CategorySection.tsx
- Copiar estrutura de FeaturedProperties
- Tornar genérico (recebe categoria via props)
- Aplicar cor/ícone da categoria

### Etapa 6: Atualizar HomePage
- Remover imports de FeaturedProperties e PropertiesGrid
- Adicionar lógica de carregamento de categorias
- Renderizar CategorySection em loop

### Etapa 7: Testar
1. Acessar `/painel/categorias`
2. Criar 2-3 categorias (ex: "Lançamentos", "Alto Padrão", "Oportunidades")
3. Reordenar com drag & drop
4. Editar imóvel e associar a categorias
5. Visualizar site público e verificar seções dinâmicas

---

## 🎨 Exemplos de Categorias

**Sugestões para imobiliárias:**

1. **Imóveis em Destaque** (slug: `destaque`)
   - Cor: `#2563eb` (azul)
   - Ícone: `Star`

2. **Lançamentos** (slug: `lancamentos`)
   - Cor: `#16a34a` (verde)
   - Ícone: `Sparkles`

3. **Alto Padrão** (slug: `alto-padrao`)
   - Cor: `#9333ea` (roxo)
   - Ícone: `Award`

4. **Oportunidades** (slug: `oportunidades`)
   - Cor: `#ea580c` (laranja)
   - Ícone: `TrendingUp`

5. **Praia** (slug: `praia`)
   - Cor: `#0891b2` (cyan)
   - Ícone: `MapPin`

6. **Investimento** (slug: `investimento`)
   - Cor: `#ca8a04` (amarelo)
   - Ícone: `DollarSign`

7. **Pronto para Morar** (slug: `pronto-morar`)
   - Cor: `#16a34a` (verde)
   - Ícone: `Home`

---

## 🔐 Permissões (RLS)

**Broker pode:**
- ✅ Ver apenas suas categorias
- ✅ Criar/editar/deletar categorias
- ✅ Associar imóveis a categorias

**Público pode:**
- ✅ Ver categorias ativas (`is_active=true` e `show_on_homepage=true`)
- ✅ Listar imóveis de categorias públicas
- ❌ Ver categorias desativadas

---

## 📊 Queries Úteis

### Listar categorias com contagem:
```sql
SELECT * FROM get_broker_categories_with_counts('broker-uuid-aqui');
```

### Listar imóveis de uma categoria:
```sql
SELECT * FROM get_category_properties(
  'broker-uuid-aqui',
  'lancamentos',
  12
);
```

### Ver associações de um imóvel:
```sql
SELECT 
  pc.name,
  pc.color,
  pca.assigned_at
FROM property_category_assignments pca
JOIN property_categories pc ON pc.id = pca.category_id
WHERE pca.property_id = 'property-uuid-aqui';
```

---

## 🚀 Benefícios do Sistema

1. **Flexibilidade Total**: Imobiliária cria quantas categorias quiser
2. **Organização Visual**: Reordenação drag & drop intuitiva
3. **Multi-Categoria**: Imóvel pode estar em várias categorias
4. **Personalização**: Cores e ícones customizáveis
5. **Performance**: Queries otimizadas com índices
6. **Segurança**: RLS garante isolamento entre brokers
7. **Migração Suave**: Categorias padrão criadas automaticamente

---

## 📝 Próximos Passos

**Após finalizar implementação:**

1. **Documentar para usuário final** (criar tutorial na aplicação)
2. **Adicionar tooltips** explicativos no painel de categorias
3. **Implementar analytics** (qual categoria mais visualizada)
4. **A/B testing** (testar ordem de categorias)
5. **SEO**: Criar páginas `/categoria/lancamentos` com URL dedicada
6. **Filtros avançados**: Permitir filtrar por categoria na busca

---

## 🎯 Status Atual

| Tarefa | Status |
|--------|--------|
| Migration SQL | ✅ Completo |
| RLS & Functions | ✅ Completo |
| Painel de Gerenciamento | ✅ Completo |
| AddPropertyDialog | ✅ Completo |
| EditPropertyDialog | 🚧 Pendente |
| CategorySection Component | 🚧 Pendente |
| HomePage Update | 🚧 Pendente |
| Testes | ⏳ Aguardando |

---

**Desenvolvido em:** 20/11/2025
**Tempo estimado para finalizar:** 2-3 horas
**Complexidade:** Média
