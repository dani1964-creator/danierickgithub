# Sistema de Visualizações Únicas por IP

## 📊 Visão Geral

Sistema completo para rastrear visualizações únicas de imóveis baseado em endereço IP, garantindo contagem precisa e evitando duplicações.

## 🏗️ Arquitetura

### Banco de Dados

**Tabela: `property_views`**
```sql
- id: UUID (PK)
- property_id: UUID (FK -> properties)
- ip_address: TEXT (IP do visitante)
- user_agent: TEXT (navegador/dispositivo)
- viewed_at: TIMESTAMP (data/hora da visualização)
- created_at: TIMESTAMP
```

**Índices:**
- `idx_property_views_property_id` - Busca por imóvel
- `idx_property_views_ip_property` - Verificação de IP único por imóvel
- `idx_property_views_unique_view` - Constraint única (ip + property_id)

### Funções RPC

#### `register_property_view(p_property_id, p_ip_address, p_user_agent)`

Registra uma visualização única. Retorna:
```json
{
  "is_new_view": true/false,
  "views_count": 123,
  "view_id": "uuid"
}
```

**Lógica:**
1. Tenta inserir registro (ip + property_id)
2. Se já existe (unique_violation), retorna `is_new_view: false`
3. Se é novo, incrementa `properties.views_count`
4. Retorna contador atualizado

#### `get_property_view_stats(p_property_id)`

Retorna estatísticas detalhadas:
```json
{
  "total_views": 150,
  "unique_views": 98,
  "today_views": 12,
  "week_views": 45,
  "month_views": 98
}
```

## 💻 Frontend

### Hook: `usePropertyViews()`

```typescript
const { registerView, getViewStats } = usePropertyViews();

// Registrar visualização
const result = await registerView(propertyId);
if (result?.is_new_view) {
  console.log('Nova visualização!', result.views_count);
}

// Obter estatísticas
const stats = await getViewStats(propertyId);
console.log('Visualizações únicas:', stats.unique_views);
```

### Componente: `<PropertyViewStats />`

Exibe estatísticas visuais com cards:
- Total de visualizações
- Visualizações únicas (IPs)
- Visualizações hoje
- Visualizações última semana
- Taxa de conversão única/total

```tsx
<PropertyViewStats 
  propertyId="uuid-do-imovel"
  propertyTitle="Casa Luxo Centro"
/>
```

## 🔄 Fluxo de Funcionamento

### 1. Usuário Acessa Página de Detalhes

```
PropertyDetailPage
  └─> usePropertyViews().registerView(propertyId)
       └─> fetch('https://api.ipify.org') // Obter IP
       └─> supabase.rpc('register_property_view')
            └─> INSERT INTO property_views (único)
            └─> Se novo: UPDATE properties SET views_count++
            └─> RETURN { is_new_view, views_count }
```

### 2. Primeira Visualização de um IP

```
IP: 192.168.1.100
Property ID: abc-123

1. INSERT INTO property_views ✅ Sucesso
2. UPDATE properties.views_count: 10 → 11
3. RETURN { is_new_view: true, views_count: 11 }
4. UI atualiza contador para 11
```

### 3. Visualização Repetida (mesmo IP)

```
IP: 192.168.1.100
Property ID: abc-123

1. INSERT INTO property_views ❌ unique_violation
2. CATCH exception
3. RETURN { is_new_view: false, views_count: 11 }
4. UI mantém contador em 11
```

## 📈 Benefícios

✅ **Precisão**: Conta apenas visualizações únicas por IP
✅ **Performance**: Constraint única no DB previne duplicatas
✅ **Estatísticas**: Métricas detalhadas (hoje, semana, mês)
✅ **Auditoria**: Histórico completo com timestamps
✅ **Escalável**: RLS policies e índices otimizados

## 🔒 Segurança

- **RLS Policies**: Visualizações públicas para leitura, apenas sistema insere
- **SECURITY DEFINER**: Funções RPC executam com permissões adequadas
- **Constraint Única**: Garante integridade no nível do banco

## 📝 Instalação

### 1. Executar SQL no Supabase

```bash
# No SQL Editor do Supabase
Executar: /supabase/sql/CREATE_PROPERTY_VIEWS_SYSTEM.sql
```

### 2. Frontend já está pronto!

- ✅ Hook `usePropertyViews` criado
- ✅ `PropertyDetailPage` atualizado
- ✅ Componente `PropertyViewStats` disponível

## 🎯 Uso no Dashboard

Adicionar estatísticas na página de detalhes do imóvel no dashboard:

```tsx
import { PropertyViewStats } from '@/components/properties/PropertyViewStats';

// Na página de detalhes do imóvel
<PropertyViewStats 
  propertyId={property.id}
  propertyTitle={property.title}
/>
```

## 🔍 Consultas Úteis

### Ver todas as visualizações de um imóvel
```sql
SELECT ip_address, user_agent, viewed_at
FROM property_views
WHERE property_id = 'uuid-do-imovel'
ORDER BY viewed_at DESC;
```

### IPs que mais visualizam
```sql
SELECT ip_address, COUNT(*) as total_views
FROM property_views
GROUP BY ip_address
ORDER BY total_views DESC
LIMIT 10;
```

### Imóveis mais visualizados
```sql
SELECT p.title, p.views_count, COUNT(pv.id) as unique_ips
FROM properties p
LEFT JOIN property_views pv ON p.id = pv.property_id
GROUP BY p.id, p.title, p.views_count
ORDER BY p.views_count DESC
LIMIT 10;
```

## ⚙️ Sincronização Home ↔ Detalhes

O contador de visualizações agora é **sincronizado automaticamente**:

1. Home carrega `properties.views_count` do banco
2. Detalhes registra visualização única via RPC
3. RPC incrementa `properties.views_count` apenas se IP novo
4. Próximo carregamento da home já mostra contador atualizado

**Cache:** Se a home usar cache, adicionar invalidação ao voltar da página de detalhes (visibilitychange event).

---

## 🚀 Pronto para Produção!

O sistema está completo e pronto para uso. Todos os componentes estão integrados e funcionando.
