# Sistema de Domínios Personalizados - Guia Completo

## 📋 Visão Geral

Sistema completo para gerenciamento de domínios personalizados com suporte a:
- ✅ Configuração manual de DNS
- ✅ Provisionamento automático via Digital Ocean
- ✅ Verificação de propagação DNS
- ✅ Monitoramento de status SSL
- ✅ Validação e normalização de domínios

## 🏗️ Arquitetura

### Componentes Principais

```
┌─────────────────────────────────────┐
│  Frontend (website.tsx)             │
│  - Botões Save p/ domains           │
│  - Verificação DNS visual           │
│  - Status indicators                │
└──────────────┬──────────────────────┘
               │
               │ HTTP POST/GET
               ▼
┌─────────────────────────────────────┐
│  APIs (/pages/api/domains/)         │
│  - configure.ts (manual)            │
│  - provision.ts (DO automation)     │
│  - verify.ts (DNS check)            │
│  - do-status.ts (SSL info)          │
│  - list.ts (listagem)               │
└──────────────┬──────────────────────┘
               │
               │ Imports
               ▼
┌─────────────────────────────────────┐
│  Utilities (lib/domainUtils.ts)     │
│  - cleanDomain()                    │
│  - isValidDomain()                  │
│  - getDnsInstructions()             │
│  - DomainErrors constants           │
└─────────────────────────────────────┘
               │
               │ Supabase Client
               ▼
┌─────────────────────────────────────┐
│  Database (Supabase)                │
│  - brokers.custom_domain            │
│  - domain_verifications (tabela)    │
│  - RLS policies                     │
└─────────────────────────────────────┘
```

### Fluxo de Dados

1. **Usuário configura domínio** → website.tsx → API configure/provision
2. **API valida e normaliza** → domainUtils.ts
3. **Verifica duplicatas** → Supabase query
4. **Salva no banco** → brokers + domain_verifications
5. **Opcional: Provisiona no DO** → Digital Ocean API
6. **Retorna instruções DNS** → Frontend exibe

## 📁 Estrutura de Arquivos

### APIs Criadas

```
frontend/pages/api/domains/
├── configure.ts     # Configuração manual (sem DO)
├── provision.ts     # Automação com Digital Ocean
├── verify.ts        # Verificação de propagação DNS
├── do-status.ts     # Status de domínio no DO
└── list.ts          # Listagem de verificações
```

### Utilities

```
frontend/lib/
└── domainUtils.ts   # Funções compartilhadas
```

### Documentação

```
docs/
├── SISTEMA_DOMINIOS_COMPLETO.md        # Este arquivo
└── REVISAO_CODIGO_DOMINIOS.md          # Resumo da refatoração
```

### Scripts SQL

```
scripts/
└── SETUP_DOMAIN_VERIFICATIONS_RLS.sql  # Setup do banco
```

## 🔌 APIs - Referência Completa

### 1. POST /api/domains/configure

**Propósito**: Configuração manual sem provisionar no Digital Ocean

**Body**:
```json
{
  "brokerId": "uuid-do-broker",
  "domain": "www.exemplo.com.br"
}
```

**Resposta Sucesso (200)**:
```json
{
  "success": true,
  "domain": "exemplo.com.br",
  "message": "Domain configured successfully. Configure DNS records:",
  "dnsRecords": [
    {
      "type": "CNAME",
      "name": "www",
      "value": "adminimobiliaria.site",
      "ttl": "1 hour"
    },
    {
      "type": "A",
      "name": "@",
      "value": "162.159.140.98",
      "ttl": "1 hour"
    }
  ],
  "note": "DNS propagation may take 24-48 hours."
}
```

**Erros Possíveis**:
- 400: Domain inválido ou faltando
- 404: Broker não encontrado
- 409: Domínio já em uso
- 500: Erro ao salvar

---

### 2. POST /api/domains/provision

**Propósito**: Provisionar domínio automaticamente no Digital Ocean

**Requer**: Variáveis `DO_ACCESS_TOKEN` e `DO_APP_ID` no `.env`

**Body**:
```json
{
  "brokerId": "uuid-do-broker",
  "domain": "www.exemplo.com.br"
}
```

**Resposta Sucesso (200)**:
```json
{
  "success": true,
  "domain": "exemplo.com.br",
  "digitalOcean": {
    "id": "...",
    "domain": "exemplo.com.br",
    "type": "PRIMARY"
  },
  "message": "Domain provisioned successfully on Digital Ocean"
}
```

**Fallback**: Se DO não configurado, funciona como `/configure`:
```json
{
  "success": true,
  "domain": "exemplo.com.br",
  "warning": "Digital Ocean variables not configured",
  "manualConfiguration": true,
  "dnsRecords": [...]
}
```

---

### 3. POST /api/domains/verify

**Propósito**: Verificar se DNS está propagado

**Body**:
```json
{
  "brokerId": "uuid-do-broker",
  "domain": "exemplo.com.br"
}
```

**Resposta**:
```json
{
  "success": true,
  "domain": "exemplo.com.br",
  "isValid": true,
  "status": "propagated",
  "message": "DNS is configured correctly"
}
```

**Status Possíveis**:
- `propagated`: DNS funcionando ✅
- `timeout`: Timeout na conexão (ainda não propagou) ⏳
- `not_propagated`: DNS não configurado ❌

---

### 4. GET /api/domains/do-status?domain=exemplo.com.br

**Propósito**: Verificar status do domínio no Digital Ocean

**Requer**: `DO_ACCESS_TOKEN` e `DO_APP_ID`

**Resposta**:
```json
{
  "success": true,
  "domain": "exemplo.com.br",
  "type": "PRIMARY",
  "wildcard": false,
  "certificate": {
    "id": "cert-id",
    "state": "ISSUED",
    "expiresAt": "2026-11-18T00:00:00Z",
    "autoRenew": true
  },
  "status": "active"
}
```

---

### 5. GET /api/domains/list?brokerId=uuid

**Propósito**: Listar todas as verificações de um broker

**Resposta**:
```json
{
  "success": true,
  "brokerId": "uuid",
  "count": 2,
  "verifications": [
    {
      "domain": "exemplo.com.br",
      "isValid": true,
      "lastChecked": "2025-11-18T10:30:00Z",
      "createdAt": "2025-11-15T08:00:00Z",
      "status": "✅ Verificado"
    },
    {
      "domain": "teste.com",
      "isValid": false,
      "lastChecked": "2025-11-18T10:25:00Z",
      "createdAt": "2025-11-17T14:00:00Z",
      "status": "❌ Falhou"
    }
  ]
}
```

## 🛠️ Utilities (domainUtils.ts)

### cleanDomain(domain: string): string

Remove protocolo, www e trailing slashes.

```typescript
cleanDomain('https://www.example.com/') // → 'example.com'
cleanDomain('HTTP://EXAMPLE.COM')        // → 'example.com'
```

### isValidDomain(domain: string): boolean

Valida formato usando regex.

```typescript
isValidDomain('example.com')       // → true
isValidDomain('sub.example.com')   // → true
isValidDomain('invalid domain')    // → false
```

### getDnsInstructions(cnameTarget: string)

Retorna objeto padronizado com instruções DNS.

### DomainErrors

Objeto com mensagens de erro padronizadas:
```typescript
DomainErrors.MISSING_DOMAIN
DomainErrors.INVALID_FORMAT
DomainErrors.DUPLICATE_DOMAIN
// ... etc
```

## 💾 Database Schema

### Tabela: domain_verifications

```sql
CREATE TABLE domain_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id UUID NOT NULL REFERENCES brokers(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  is_valid BOOLEAN DEFAULT false,
  last_checked TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX idx_domain_verifications_broker ON domain_verifications(broker_id);
CREATE INDEX idx_domain_verifications_domain ON domain_verifications(domain);
CREATE INDEX idx_domain_verifications_broker_valid ON domain_verifications(broker_id, is_valid);
```

### RLS Policies

- Brokers só podem ver suas próprias verificações
- Inserts permitidos apenas para brokers autenticados
- Updates permitidos apenas para o próprio broker

### Trigger

`cleanup_old_domain_verification`: Invalida verificações antigas quando o domínio muda.

## 🔐 Variáveis de Ambiente

### Obrigatórias

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=seu-service-key
NEXT_PUBLIC_BASE_DOMAIN=adminimobiliaria.site
```

### Opcionais (para automação Digital Ocean)

```env
DO_ACCESS_TOKEN=seu-token-do
DO_APP_ID=seu-app-id
```

**Nota**: Se DO não configurado, sistema funciona em modo manual (retorna instruções DNS).

## 🚀 Uso Prático

### Exemplo 1: Configuração Manual (GoDaddy, Registro.br, etc.)

```bash
# 1. Configurar domínio
curl -X POST https://seu-site.com/api/domains/configure \
  -H "Content-Type: application/json" \
  -d '{
    "brokerId": "uuid-broker",
    "domain": "www.minhaimo.com.br"
  }'

# Resposta: Instruções DNS
# → Configurar no painel do registrador

# 2. Aguardar 24-48h

# 3. Verificar propagação
curl -X POST https://seu-site.com/api/domains/verify \
  -H "Content-Type: application/json" \
  -d '{
    "brokerId": "uuid-broker",
    "domain": "minhaimo.com.br"
  }'
```

### Exemplo 2: Automação com Digital Ocean

```bash
# 1. Provisionar (já adiciona no DO automaticamente)
curl -X POST https://seu-site.com/api/domains/provision \
  -H "Content-Type: application/json" \
  -d '{
    "brokerId": "uuid-broker",
    "domain": "www.minhaimo.com.br"
  }'

# 2. Verificar status SSL
curl https://seu-site.com/api/domains/do-status?domain=minhaimo.com.br

# 3. Listar todas as verificações
curl https://seu-site.com/api/domains/list?brokerId=uuid-broker
```

## 🐛 Troubleshooting

### DNS não propaga

1. Verificar registros no painel do registrador
2. Usar `dig` ou `nslookup`:
   ```bash
   dig www.minhaimo.com.br
   nslookup minhaimo.com.br
   ```
3. Aguardar 24-48h (pode levar até 72h)

### Domínio duplicado

- Cada domínio só pode estar associado a 1 broker
- Verificar: `SELECT * FROM brokers WHERE custom_domain = 'dominio.com'`
- Remover domínio antigo antes de reatribuir

### Digital Ocean API error

- Verificar se `DO_ACCESS_TOKEN` está válido
- Verificar se `DO_APP_ID` está correto
- Checar logs: `/var/log/app.log` ou console do Digital Ocean

### SSL não emitido

- Verificar no DO Dashboard → Apps → Domínios
- Pode levar até 1 hora após DNS propagar
- Verificar com: `GET /api/domains/do-status?domain=...`

## 📊 Métricas de Refatoração

### Antes
- 5 APIs com ~150 linhas de código duplicado
- Validações inconsistentes
- Mensagens de erro diferentes
- Documentação espalhada em 3+ arquivos

### Depois
- 5 APIs + 1 arquivo de utilities (domainUtils.ts)
- ~90 linhas eliminadas de duplicação
- Validação padronizada e reutilizável
- 1 guia consolidado

### Arquivos Impactados
- ✅ `frontend/lib/domainUtils.ts` (NOVO)
- ✅ `frontend/pages/api/domains/configure.ts` (refatorado)
- ✅ `frontend/pages/api/domains/provision.ts` (refatorado)
- ✅ `frontend/pages/api/domains/verify.ts`
- ✅ `frontend/pages/api/domains/do-status.ts`
- ✅ `frontend/pages/api/domains/list.ts`

## ✅ Checklist de Deploy

- [ ] Executar `SETUP_DOMAIN_VERIFICATIONS_RLS.sql` no Supabase
- [ ] Configurar variáveis de ambiente (DO opcional)
- [ ] Testar API `/configure` com domínio de teste
- [ ] Testar API `/verify` após configurar DNS
- [ ] Validar que middleware NÃO consulta banco (apenas rewrites)
- [ ] Deploy em produção
- [ ] Monitorar logs de erro

## 🔗 Referências

- [Digital Ocean API Docs](https://docs.digitalocean.com/reference/api/api-reference/)
- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [DNS Propagation Checker](https://www.whatsmydns.net/)

---

**Última atualização**: 18 de novembro de 2025
