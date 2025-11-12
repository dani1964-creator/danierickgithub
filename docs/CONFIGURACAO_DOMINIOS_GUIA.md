# Guia de Configuração de Domínios

## 📋 Visão Geral

Existem **2 páginas** de configuração no painel admin, cada uma com propósito específico:

```
┌─────────────────────────────────────────────────────────────┐
│  1. CONFIGURAÇÕES DO SITE (painel/site.tsx)                │
│     ✅ Recomendado para 99% dos usuários                    │
├─────────────────────────────────────────────────────────────┤
│  • Subdomínio SaaS (*.adminimobiliaria.site)               │
│  • 1 Domínio Personalizado Principal                        │
│  • Configuração simples e rápida                            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  2. CONFIGURAÇÕES GERAIS (painel/configuracoes.tsx)        │
│     🔧 Apenas para casos avançados                          │
├─────────────────────────────────────────────────────────────┤
│  • Perfil do Broker                                          │
│  • Múltiplos Domínios Adicionais                            │
│  • Gerenciamento individual de cada domínio                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Quando Usar Cada Página

### Configurações do Site (`painel/site.tsx`)

**Use quando:**
- ✅ Quer configurar seu site pela primeira vez
- ✅ Precisa de 1 subdomínio SaaS + opcionalmente 1 domínio próprio
- ✅ Quer algo simples e que funcione imediatamente

**Campos gerenciados:**
```typescript
brokers.website_slug    // "joao" → joao.adminimobiliaria.site
brokers.subdomain       // "joao" (sincronizado automaticamente)
brokers.custom_domain   // "www.imobiliariajoao.com.br" (opcional)
```

**Exemplo de uso:**
```
Broker: João Silva
Subdomínio SaaS: joao → https://joao.adminimobiliaria.site
Custom Domain: www.imobiliariajoao.com.br → https://www.imobiliariajoao.com.br
```

---

### Configurações Gerais (`painel/configuracoes.tsx`)

**Use quando:**
- 🔧 Precisa gerenciar múltiplos domínios (multi-marca)
- 🔧 Quer testar diferentes domínios
- 🔧 Tem casos especiais que exigem mais de 1 domínio

**Tabela gerenciada:**
```typescript
broker_domains
├─ broker_id: UUID
├─ domain: "app.cliente.com"
├─ is_active: boolean
└─ created_at: timestamp
```

**Exemplo de uso:**
```
Broker: João Silva
Domínios adicionais:
  • vitrine.imobiliariajoao.com.br
  • app.cliente.com
  • teste.site.com.br
```

---

## 📊 Comparação Lado a Lado

| Característica | Configurações do Site | Configurações Gerais |
|----------------|----------------------|---------------------|
| **Complexidade** | 🟢 Simples | 🟡 Avançado |
| **Quantidade** | 1 SaaS + 1 Custom | Ilimitados |
| **Banco de Dados** | `brokers` table | `broker_domains` table |
| **Provisionamento** | Automático | Manual |
| **Público-alvo** | Todos os usuários | Power users |
| **SSL** | Automático | Requer configuração |

---

## 🔄 Fluxo de Resolução de Domínio

### BrokerResolver - Como Funciona

```typescript
// 1. Verifica se é subdomínio SaaS
if (host.endsWith('.adminimobiliaria.site')) {
  const slug = host.split('.')[0]; // "joao"
  return buscarPorWebsiteSlug(slug);
}

// 2. Verifica custom_domain principal (brokers.custom_domain)
const broker = await buscarPorCustomDomain(host);
if (broker) return broker.id;

// 3. Verifica domínios adicionais (broker_domains)
const domain = await buscarEmBrokerDomains(host);
if (domain) return domain.broker_id;

// 4. Não encontrado
return null;
```

---

## 📝 Arquitetura dos Campos

### Tabela: `brokers`

| Campo | Propósito | Exemplo | Obrigatório |
|-------|-----------|---------|-------------|
| `website_slug` | Identificador único | "joao" | ✅ Sim |
| `subdomain` | Alias (sincronizado) | "joao" | ✅ Sim (auto) |
| `custom_domain` | Domínio principal | "www.joao.com" | ❌ Opcional |

### Tabela: `broker_domains`

| Campo | Propósito | Exemplo |
|-------|-----------|---------|
| `broker_id` | Referência ao broker | UUID |
| `domain` | Domínio adicional | "app.cliente.com" |
| `is_active` | Ativo/Inativo | true/false |

---

## ✅ Boas Práticas

### DO ✅

1. **Use Configurações do Site** para setup inicial
2. **Mantenha website_slug simples** (ex: "joao", não "joao-silva-corretor-123")
3. **Custom domain deve substituir SaaS**, não criar subdomínios
4. **Teste no SaaS primeiro**, depois configure custom domain

### DON'T ❌

1. ❌ Não tente criar "subdomínio dentro de custom domain"
2. ❌ Não use caracteres especiais em website_slug
3. ❌ Não adicione múltiplos domínios sem necessidade real
4. ❌ Não desative o domínio principal em broker_domains sem fallback

---

## 🚀 Guia Rápido de Configuração

### Passo 1: Subdomínio SaaS (Grátis e Imediato)

1. Acesse: `painel.adminimobiliaria.site/painel/site`
2. Preencha o slug: `joao`
3. Clique em **Salvar**
4. Pronto! Seu site: `joao.adminimobiliaria.site`

### Passo 2: Domínio Próprio (Opcional)

1. Na mesma página, seção "Domínio Personalizado"
2. Digite: `www.imobiliariajoao.com.br`
3. Configure CNAME no seu provedor DNS:
   ```
   Tipo: CNAME
   Nome: www (ou @)
   Valor: adminimobiliaria.site
   ```
4. Aguarde propagação DNS (até 48h)
5. Clique em **Verificar DNS**

### Passo 3: Domínios Adicionais (Avançado)

1. Acesse: `painel.adminimobiliaria.site/painel/configuracoes`
2. Role até "Domínios Adicionais"
3. Adicione quantos domínios precisar
4. Configure DNS para cada um
5. Ative/desative conforme necessário

---

## 🔧 Sincronização Automática

### Trigger SQL: `website_slug` ↔ `subdomain`

```sql
-- Mantém subdomain sempre igual a website_slug
CREATE TRIGGER trigger_sync_broker_subdomain
  BEFORE UPDATE ON public.brokers
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_broker_subdomain();
```

**Comportamento:**
- Atualiza `website_slug` → `subdomain` atualiza automaticamente
- Atualiza `subdomain` → `website_slug` atualiza automaticamente
- Garante consistência 100%

---

## 📁 Arquivos Relacionados

```
frontend/pages/
├── painel/
│   ├── site.tsx              ← Configuração simples (USE ESTE)
│   └── configuracoes.tsx     ← Redireciona para settings.tsx
└── settings.tsx              ← Configuração avançada

frontend/lib/
└── brokerResolver.ts         ← Lógica de resolução de domínios

supabase/sql/
├── fix-subdomain-sync-trigger.sql   ← Sincronização automática
└── fix-rfimobiliaria-subdomain.sql  ← Migração de dados

docs/
├── DOMAIN_ARCHITECTURE.md    ← Arquitetura completa
└── SUBDOMAIN_SYNC_SOLUTION.md ← Solução de sincronização
```

---

## 🎯 Resumo Final

### Para Usuários Normais:
```
Use: painel/site.tsx
Configure: 1 slug + 1 custom domain (opcional)
Resultado: Site funcionando em minutos
```

### Para Power Users:
```
Use: painel/configuracoes.tsx
Configure: Múltiplos domínios adicionais
Resultado: Flexibilidade máxima (mas mais complexo)
```

### Recomendação:
**99% dos brokers devem usar apenas `painel/site.tsx`**

A página de configurações avançadas existe para casos especiais, mas não é necessária para operação normal.

---

**Dúvidas?** Consulte:
- `docs/DOMAIN_ARCHITECTURE.md` - Arquitetura detalhada
- `docs/SUBDOMAIN_SYNC_SOLUTION.md` - Sincronização automática
