# Arquitetura Definitiva: Domínios e Subdomínios

## 🎯 Problema Identificado

Você identificou corretamente uma **confusão conceitual** entre 3 campos diferentes:

| Campo | Uso Atual | Problema |
|-------|-----------|----------|
| `website_slug` | Subdomínio SaaS | Confunde com custom_domain |
| `subdomain` | Subdomínio SaaS | Duplica website_slug |
| `custom_domain` | Domínio próprio | Deveria estar em tabela separada? |

---

## ✅ Arquitetura Correta e Definitiva

### **Cenário 1: Subdomínio do SaaS (*.adminimobiliaria.site)**

**Exemplo:** `joao.adminimobiliaria.site`

```
┌─────────────────────────────────────────┐
│ Tabela: brokers                         │
├─────────────────────────────────────────┤
│ website_slug: "joao"    ← ÚNICO CAMPO   │
│ subdomain: "joao"       ← SINCRONIZADO  │
│ custom_domain: NULL     ← NÃO USA       │
└─────────────────────────────────────────┘
```

**Campos usados:**
- ✅ `website_slug` = "joao" (FONTE DA VERDADE)
- ✅ `subdomain` = "joao" (sincronizado via trigger)
- ❌ `custom_domain` = NULL

**Configuração no Painel:**
```
📍 Configurações > Site
┌────────────────────────────────┐
│ Slug do Site:                  │
│ ┌──────────────────────────┐   │
│ │ joao                     │   │
│ └──────────────────────────┘   │
│                                │
│ Seu site: joao.adminimobiliaria.site │
└────────────────────────────────┘
```

---

### **Cenário 2: Domínio Personalizado (ex: imobiliariajoao.com.br)**

**Exemplo:** Cliente quer usar `www.imobiliariajoao.com.br`

```
┌─────────────────────────────────────────┐
│ Tabela: brokers                         │
├─────────────────────────────────────────┤
│ website_slug: "joao"    ← MANTÉM        │
│ subdomain: "joao"       ← MANTÉM        │
│ custom_domain: "www.imobiliariajoao..." │
└─────────────────────────────────────────┘
       OU (MELHOR - Tabela separada)
┌─────────────────────────────────────────┐
│ Tabela: broker_domains                  │
├─────────────────────────────────────────┤
│ broker_id: [FK para brokers]            │
│ domain: "www.imobiliariajoao.com.br"    │
│ is_verified: true                       │
│ is_active: true                         │
└─────────────────────────────────────────┘
```

**Campos usados:**
- ✅ `website_slug` = "joao" (AINDA EXISTE - fallback)
- ✅ `subdomain` = "joao" (AINDA EXISTE - fallback)
- ✅ `custom_domain` = "www.imobiliariajoao.com.br" (domínio próprio)

**Configuração no Painel:**
```
📍 Configurações > Domínio Personalizado
┌────────────────────────────────┐
│ Domínio Personalizado:         │
│ ┌──────────────────────────┐   │
│ │ www.imobiliariajoao.com.br │ │
│ └──────────────────────────┘   │
│                                │
│ Status: ✅ Verificado          │
│                                │
│ Configure CNAME:               │
│ Tipo: CNAME                    │
│ Nome: @                        │
│ Valor: proxy.adminimobiliaria.site │
└────────────────────────────────┘
```

---

## 🚫 O que NÃO faz sentido (sua dúvida)

### ❌ Subdomínio dentro de Domínio Personalizado

**ERRADO:** Querer criar `teste.imobiliariajoao.com.br`

```
┌────────────────────────────────┐
│ ❌ NÃO FAZ SENTIDO:            │
├────────────────────────────────┤
│ Domínio: imobiliariajoao.com.br│
│ Subdomínio: teste              │
│                                │
│ Resultado: teste.imobiliariajoao.com.br │
│                                │
│ POR QUÊ NÃO?                   │
│ - Cliente tem 1 site apenas    │
│ - Subdomínios do SaaS já existem│
│ - Confuso e redundante         │
└────────────────────────────────┘
```

**Você está CERTO!** Isso não faz sentido porque:
1. Cada broker tem **apenas 1 site público**
2. Subdomínios já são gerenciados em `*.adminimobiliaria.site`
3. Custom domain é para **substituir** o subdomínio SaaS, não criar novos

---

## ✅ Decisão Arquitetural Final

### **3 Campos - 3 Propósitos Distintos**

| Campo | Propósito | Exemplo | Obrigatório |
|-------|-----------|---------|-------------|
| `website_slug` | Identificador único do broker | "joao" | ✅ Sim |
| `subdomain` | Alias sincronizado (mesmo que website_slug) | "joao" | ✅ Sim (auto) |
| `custom_domain` | Domínio próprio do cliente | "imobiliariajoao.com.br" | ❌ Opcional |

### **Fluxo de Resolução**

```typescript
// BrokerResolver - Lógica Simplificada
if (host.endsWith('.adminimobiliaria.site')) {
  // Subdomínio SaaS
  const slug = extrairSubdominio(host); // "joao"
  return buscarPorWebsiteSlug(slug);
} else {
  // Domínio personalizado
  return buscarPorCustomDomain(host);
}
```

---

## 🔧 Correções Necessárias

### 1. **UI do Painel Admin - Simplificar**

**ANTES (Confuso):**
```tsx
// Seção 1: Slug
<Input value={websiteSlug} />

// Seção 2: Domínio Personalizado
<Input value={customDomain} />
<Input value={customSubdomain} /> ❌ REMOVER ISSO!
```

**DEPOIS (Claro):**
```tsx
// Seção 1: Subdomínio SaaS
<Label>Slug do Site</Label>
<Input 
  value={websiteSlug}
  placeholder="joao"
/>
<p>Seu site: {websiteSlug}.adminimobiliaria.site</p>

// Seção 2: Domínio Personalizado (Opcional)
<Label>Domínio Próprio</Label>
<Input 
  value={customDomain}
  placeholder="imobiliariajoao.com.br"
/>
<p>Substitui o subdomínio SaaS pelo seu domínio</p>
```

### 2. **Banco de Dados - Manter Simples**

```sql
-- Tabela brokers
CREATE TABLE brokers (
  website_slug TEXT UNIQUE NOT NULL,  -- Ex: "joao"
  subdomain TEXT UNIQUE NOT NULL,     -- Ex: "joao" (trigger sincroniza)
  custom_domain TEXT UNIQUE,          -- Ex: "imobiliariajoao.com.br" (opcional)
  ...
);

-- OU (melhor para múltiplos domínios futuros):
CREATE TABLE broker_domains (
  broker_id UUID REFERENCES brokers(id),
  domain TEXT UNIQUE NOT NULL,        -- Ex: "imobiliariajoao.com.br"
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  ...
);
```

### 3. **Remover Campo de "Subdomínio" em Custom Domain**

Se existe algum campo no painel tipo:
```
Domínio: [imobiliariajoao.com.br]
Subdomínio: [teste] ❌ REMOVER
```

**Isso deve ser removido completamente!**

---

## 📊 Casos de Uso Reais

### Caso 1: Broker Iniciante (Grátis)
```
website_slug: "joao-corretor"
subdomain: "joao-corretor" (auto)
custom_domain: NULL

Site público: https://joao-corretor.adminimobiliaria.site
```

### Caso 2: Broker Premium (Com domínio próprio)
```
website_slug: "joao-corretor" (mantém para fallback)
subdomain: "joao-corretor" (mantém para fallback)
custom_domain: "www.joaoimoveis.com.br"

Site público: https://www.joaoimoveis.com.br
Fallback: https://joao-corretor.adminimobiliaria.site (se DNS falhar)
```

### Caso 3: Broker Enterprise (Múltiplos domínios - futuro)
```
broker_id: "uuid-joao"
website_slug: "joao-corretor"

broker_domains:
  - domain: "www.joaoimoveis.com.br"
  - domain: "www.joaoimoveisluxo.com.br"
  - domain: "www.imoveis-joao.com"

Todos apontam para o mesmo site/broker!
```

---

## ✅ Ação Recomendada

1. **Remover qualquer UI de "subdomínio personalizado" dentro de custom domain**
2. **Manter arquitetura:**
   - `website_slug` = subdomínio SaaS
   - `custom_domain` = domínio próprio (substitui o SaaS)
3. **NÃO criar** subdomínios dentro de custom_domain
4. **Documentar claramente** no painel o que cada campo faz

---

## 🎯 Resumo Final

**SUA INTUIÇÃO ESTAVA CORRETA!**

✅ **Faz sentido:**
- Subdomínio SaaS: `joao.adminimobiliaria.site`
- Domínio próprio: `imobiliariajoao.com.br`

❌ **NÃO faz sentido:**
- Subdomínio dentro de domínio próprio: `teste.imobiliariajoao.com.br`

**Arquitetura correta:**
```
website_slug + subdomain = MESMO VALOR (subdomínio SaaS)
custom_domain = DOMÍNIO PRÓPRIO (substitui SaaS, não cria subdomínio)
```

---

**Próximo passo:** Você quer que eu remova qualquer código/UI que tenta criar "subdomínio dentro de custom domain"?
