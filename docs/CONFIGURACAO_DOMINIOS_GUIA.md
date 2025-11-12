# Guia de Configuração de Domínios

## 📋 Visão Geral

O painel admin possui **2 seções** principais de configuração:

```
┌─────────────────────────────────────────────────────────────┐
│  1. CONFIGURAÇÕES DO SITE (painel/site.tsx)                │
│     📍 Domínios e Subdomínios                                │
├─────────────────────────────────────────────────────────────┤
│  • Subdomínio SaaS (*.adminimobiliaria.site)               │
│  • 1 Domínio Personalizado (opcional)                       │
│  • Configuração simples e rápida                            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  2. CONFIGURAÇÕES GERAIS (painel/configuracoes.tsx)        │
│     ⚙️ Perfil do Broker                                      │
├─────────────────────────────────────────────────────────────┤
│  • Dados de contato (telefone, email, WhatsApp)            │
│  • Informações da empresa (nome, endereço, CRECI)          │
│  • Textos sobre a empresa e rodapé                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Configuração de Domínios

### Onde Configurar

**Use apenas: `painel/site.tsx`**

Acesso: `painel.adminimobiliaria.site/painel/site`

### Opções Disponíveis

#### 1. **Subdomínio SaaS (Grátis e Imediato)**

**Exemplo:** `joao.adminimobiliaria.site`

```
Campo: website_slug
Valor: "joao"
Resultado: https://joao.adminimobiliaria.site
```

**Características:**
- ✅ Funciona imediatamente após salvar
- ✅ SSL automático (HTTPS)
- ✅ Sem custo adicional
- ✅ Fácil de compartilhar

---

#### 2. **Domínio Personalizado (Opcional)**

**Exemplo:** `www.imobiliariajoao.com.br`

```
Campo: custom_domain
Valor: "www.imobiliariajoao.com.br"
Resultado: https://www.imobiliariajoao.com.br
```

**Características:**
- ✅ Substitui o subdomínio SaaS
- ✅ Mais profissional
- ⚠️ Requer domínio próprio
- ⚠️ Requer configuração DNS
- ⚠️ Propagação pode levar até 48h

---

## 📊 Arquitetura dos Campos

### Tabela: `brokers`

| Campo | Propósito | Exemplo | Obrigatório |
|-------|-----------|---------|-------------|
| `website_slug` | Identificador único | "joao" | ✅ Sim |
| `subdomain` | Alias (sincronizado) | "joao" | ✅ Sim (auto) |
| `custom_domain` | Domínio próprio | "www.joao.com" | ❌ Opcional |

**Sincronização Automática:**
- `subdomain` é sempre igual a `website_slug`
- Trigger SQL mantém sincronizado automaticamente
- Não precisa se preocupar com isso

---

## 🚀 Guia Passo a Passo

### Passo 1: Configurar Subdomínio SaaS

1. Acesse: `painel.adminimobiliaria.site/painel/site`
2. Na seção "Subdomínio SaaS":
   - Digite o slug desejado (ex: `joao`)
   - Use apenas letras minúsculas, números e hífens
3. Clique em **Salvar**
4. ✅ Pronto! Seu site: `joao.adminimobiliaria.site`

**Dica:** Escolha um slug curto e fácil de lembrar.

---

### Passo 2: Adicionar Domínio Próprio (Opcional)

#### 2.1. Na Plataforma

1. Acesse: `painel.adminimobiliaria.site/painel/site`
2. Na seção "Domínio Personalizado":
   - Digite seu domínio (ex: `www.imobiliariajoao.com.br`)
   - Clique em **Salvar**

#### 2.2. No Provedor de Domínio

Configure um registro CNAME no painel do seu provedor:

```
Tipo: CNAME
Nome: www (ou @ para domínio raiz)
Valor: adminimobiliaria.site
TTL: 3600 (ou deixe padrão)
```

**Provedores comuns:**
- Registro.br: https://registro.br
- GoDaddy: painel de DNS
- Hostinger: painel de gerenciamento
- Cloudflare: DNS management

#### 2.3. Aguardar Propagação

- Tempo médio: 1-6 horas
- Máximo: até 48 horas
- Você pode verificar em: https://dnschecker.org

#### 2.4. Verificar na Plataforma

1. Volte para `painel/site`
2. Clique em **Verificar DNS**
3. Aguarde status "✅ Verificado"

---

## ✅ Boas Práticas

### DO ✅

1. **Use slugs simples** - "joao" em vez de "joao-silva-corretor-123"
2. **Teste o SaaS primeiro** - Certifique-se que funciona antes de configurar custom domain
3. **Configure www** - Use `www.seudominio.com` em vez de apenas `seudominio.com`
4. **Aguarde propagação** - DNS leva tempo, seja paciente

### DON'T ❌

1. ❌ **Não use caracteres especiais** no slug (acentos, espaços, etc)
2. ❌ **Não mude o slug frequentemente** - Links antigos param de funcionar
3. ❌ **Não tente criar subdomínios** dentro do custom domain
4. ❌ **Não desative o custom domain** sem ter o SaaS configurado

---

## 🔄 Fluxo de Resolução

### Como o Sistema Identifica seu Site

```typescript
// Ordem de verificação:
1. Verifica se é subdomínio SaaS (*.adminimobiliaria.site)
   → Busca por website_slug

2. Se não for SaaS, verifica custom_domain
   → Busca por domínio personalizado

3. Se não encontrar, retorna 404
```

**Exemplo prático:**

```
Acesso: joao.adminimobiliaria.site
✅ Encontra broker com website_slug = "joao"
✅ Carrega site do João

Acesso: www.imobiliariajoao.com.br
✅ Encontra broker com custom_domain = "www.imobiliariajoao.com.br"
✅ Carrega site do João

Acesso: naoexiste.adminimobiliaria.site
❌ Não encontra broker
❌ Retorna 404
```

---

## 🛠️ Configuração de Perfil

### Onde Configurar

**Use: `painel/configuracoes.tsx`**

Acesso: `painel.adminimobiliaria.site/painel/configuracoes`

### Informações Disponíveis

```
✅ Nome da Empresa
✅ Nome de Exibição
✅ Email de Contato
✅ Telefone
✅ WhatsApp
✅ CRECI
✅ Endereço
✅ Sobre a Imobiliária
✅ Texto do Rodapé
```

**Nota:** Para configurar domínios, use `painel/site`, não `configuracoes`.

---

## 📁 Arquivos do Sistema

```
frontend/pages/
├── painel/
│   ├── site.tsx              ← Configuração de domínios
│   └── configuracoes.tsx     ← Configuração de perfil
└── settings.tsx              ← Implementação do perfil

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

## ❓ Perguntas Frequentes

### 1. Posso ter múltiplos domínios?
Não. Cada broker tem:
- 1 subdomínio SaaS
- 1 domínio personalizado (opcional)

### 2. O que acontece se eu mudar o slug?
- O endereço antigo para de funcionar
- Links compartilhados quebram
- Recomendamos não mudar após divulgação

### 3. Preciso pagar pelo custom domain?
- O sistema não cobra
- Você precisa ter um domínio registrado (GoDaddy, Registro.br, etc)
- O custo é do registro do domínio (~R$40/ano)

### 4. Custom domain funciona sem o SaaS?
- Não! Sempre configure o SaaS primeiro
- Custom domain é adicional, não substitui internamente
- Se DNS falhar, o SaaS serve como fallback

### 5. Posso usar domínio raiz (sem www)?
- Sim, mas CNAME pode não funcionar
- Recomendamos usar `www.seudominio.com`
- Para domínio raiz, consulte seu provedor sobre A/AAAA records

---

## 📞 Suporte

Problemas com configuração?

1. **Verifique o DNS:** https://dnschecker.org
2. **Consulte o provedor:** Cada provedor tem processo diferente
3. **Aguarde propagação:** Pode levar até 48h

---

## 🎯 Resumo Final

### Configuração Simples (Recomendado):
```
1. Configure slug em painel/site
2. Pronto! Use: seuslug.adminimobiliaria.site
```

### Configuração com Domínio Próprio:
```
1. Configure slug em painel/site
2. Adicione custom domain
3. Configure CNAME no provedor
4. Aguarde propagação
5. Verifique status
```

### Configuração de Perfil:
```
1. Acesse painel/configuracoes
2. Preencha dados da empresa
3. Salve alterações
```

---

**Tudo configurado!** Agora você tem:
- ✅ Subdomínio SaaS funcionando
- ✅ (Opcional) Domínio personalizado
- ✅ Perfil da empresa completo
