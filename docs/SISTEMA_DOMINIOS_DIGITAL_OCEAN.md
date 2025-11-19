# 🌐 Sistema de Domínios Personalizados - Digital Ocean DNS

Sistema completo de domínios personalizados com delegação de nameservers para Digital Ocean e painel de gerenciamento DNS para clientes.

---

## 📋 Índice

1. [Arquitetura](#arquitetura)
2. [Configuração Inicial](#configuração-inicial)
3. [Fluxo de Uso](#fluxo-de-uso)
4. [APIs Disponíveis](#apis-disponíveis)
5. [Componente React](#componente-react)
6. [Cron Job de Verificação](#cron-job-de-verificação)
7. [Testes](#testes)
8. [Troubleshooting](#troubleshooting)

---

## 🏗️ Arquitetura

### Estratégia: Delegação de Nameservers

```
┌─────────────────┐
│  Registrador    │ (GoDaddy, Hostinger, etc)
│  (Cliente)      │
└────────┬────────┘
         │
         │ Delega nameservers para DO
         │ (configuração única)
         ↓
┌─────────────────┐
│ Digital Ocean   │
│ DNS Manager     │
└────────┬────────┘
         │
         │ Gerencia TODOS os registros DNS
         │ via API (automático)
         ↓
┌─────────────────┐
│  SaaS Panel     │
│  (Cliente)      │
│  - Add MX       │
│  - Add CNAME    │
│  - Add A/TXT    │
└─────────────────┘
```

### Vantagens

✅ **Zero configuração manual**: Desenvolvedor não mexe em DNS  
✅ **Cliente autônomo**: Adiciona MX/subdomínios via painel  
✅ **Verificação automática**: Cron job ativa domínio automaticamente  
✅ **Suporte a email**: Cliente configura Gmail/Outlook via MX  
✅ **Subdomínios ilimitados**: blog.dominio.com, loja.dominio.com, etc  

---

## ⚙️ Configuração Inicial

### 1. Executar SQL no Supabase

Acesse o **SQL Editor** do Supabase e execute:

```bash
/workspaces/danierickgithub/scripts/SETUP_DNS_ZONES_DIGITAL_OCEAN.sql
```

Este script cria:
- Tabela `dns_zones`: Armazena zonas DNS com status de verificação
- Tabela `dns_records`: Armazena registros DNS customizados (MX, CNAME, A, TXT)
- **RLS Policies**: Cada broker só vê suas próprias zonas e registros
- **Indexes**: Otimização de queries
- **Triggers**: Auto-atualização de timestamps

### 2. Configurar Variáveis de Ambiente

Adicione no **.env** do frontend:

```env
# Digital Ocean API Token (criar em: cloud.digitalocean.com/account/api/tokens)
DO_ACCESS_TOKEN=dop_v1_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# IP do App Platform (encontrar em: App > Settings > Domains)
NEXT_PUBLIC_APP_IP=162.159.140.98

# Token secreto para cron job (gerar com: openssl rand -hex 32)
CRON_SECRET_TOKEN=seu-token-secreto-aqui

# Service Role Key do Supabase (para bypass RLS no cron)
SUPABASE_SERVICE_ROLE_KEY=seu-service-role-key
```

### 3. Deploy no Digital Ocean App Platform

```bash
git add .
git commit -m "feat: Sistema completo de DNS com Digital Ocean"
git push origin main
```

O deploy automático irá:
1. Buildar aplicação com novas variáveis
2. Disponibilizar APIs de DNS
3. Ativar componente React no painel

---

## 🔄 Fluxo de Uso

### Para o Cliente

1. **Adicionar Domínio**
   - Acessa painel de configurações
   - Insere domínio (ex: `minhaempresa.com.br`)
   - Clica em "Configurar Domínio"

2. **Sistema Cria Zona Automática**
   - API `/api/domains/do-create-zone` cria zona no Digital Ocean
   - Adiciona registros automáticos:
     - `www.minhaempresa.com.br` → CNAME → `adminimobiliaria.site`
     - `*.minhaempresa.com.br` → CNAME → `adminimobiliaria.site` (wildcard)
   - Retorna nameservers do Digital Ocean

3. **Cliente Configura Nameservers**
   - Acessa painel do registrador (GoDaddy, Registro.br, etc)
   - Altera para "Nameservers Personalizados"
   - Adiciona os 3 nameservers fornecidos:
     ```
     ns1.digitalocean.com
     ns2.digitalocean.com
     ns3.digitalocean.com
     ```

4. **Verificação Automática**
   - Cron job verifica a cada 5 minutos via Google DNS API
   - Quando nameservers propagam → status muda para `active`
   - Cliente recebe notificação

5. **Gerenciar DNS**
   - Cliente adiciona registros via painel:
     - **MX**: Configurar Gmail (`ASPMX.L.GOOGLE.COM`)
     - **CNAME**: Criar subdomínio `blog.minhaempresa.com.br`
     - **TXT**: Verificação de domínio (SPF, DKIM)

---

## 📡 APIs Disponíveis

### 1. POST `/api/domains/do-create-zone`

**Propósito**: Criar zona DNS no Digital Ocean

**Body**:
```json
{
  "brokerId": "uuid-do-broker",
  "domain": "minhaempresa.com.br"
}
```

**Response**:
```json
{
  "success": true,
  "zoneId": "uuid-da-zona",
  "domain": "minhaempresa.com.br",
  "nameservers": [
    "ns1.digitalocean.com",
    "ns2.digitalocean.com",
    "ns3.digitalocean.com"
  ],
  "instructions": "Configure os nameservers no seu registrador..."
}
```

**Arquivos**: `frontend/pages/api/domains/do-create-zone.ts`

---

### 2. POST `/api/domains/do-verify-nameservers`

**Propósito**: Verificar se nameservers foram configurados

**Body**:
```json
{
  "domain": "minhaempresa.com.br"
}
```

**Response**:
```json
{
  "isActive": true,
  "nameserversDetected": ["ns1.digitalocean.com", "ns2.digitalocean.com"],
  "message": "Nameservers configurados corretamente!"
}
```

**Arquivos**: `frontend/pages/api/domains/do-verify-nameservers.ts`

---

### 3. POST `/api/domains/do-add-record`

**Propósito**: Adicionar registro DNS customizado

**Body**:
```json
{
  "zoneId": "uuid-da-zona",
  "recordType": "MX",
  "name": "@",
  "value": "ASPMX.L.GOOGLE.COM",
  "priority": 1
}
```

**Tipos Suportados**:
- `MX`: Email (requer `priority`)
- `CNAME`: Subdomínios/aliases
- `A`: Apontar para IP
- `TXT`: Verificação (SPF, DKIM)

**Response**:
```json
{
  "success": true,
  "record": {
    "id": "uuid",
    "record_type": "MX",
    "name": "@",
    "value": "ASPMX.L.GOOGLE.COM",
    "priority": 1
  }
}
```

**Arquivos**: `frontend/pages/api/domains/do-add-record.ts`

---

### 4. GET `/api/domains/do-list-records?zoneId=uuid`

**Propósito**: Listar todos os registros DNS de uma zona

**Response**:
```json
{
  "zone": {
    "id": "uuid",
    "domain": "minhaempresa.com.br",
    "status": "active",
    "nameservers": ["ns1.digitalocean.com"],
    "activated_at": "2024-01-15T10:30:00Z"
  },
  "records": [
    {
      "id": "uuid",
      "record_type": "MX",
      "name": "@",
      "value": "ASPMX.L.GOOGLE.COM",
      "priority": 1,
      "ttl": 3600
    }
  ]
}
```

**Arquivos**: `frontend/pages/api/domains/do-list-records.ts`

---

### 5. POST `/api/cron/verify-nameservers` (Cron Job)

**Propósito**: Verificar automaticamente zonas pendentes

**Headers**:
```
Authorization: Bearer <CRON_SECRET_TOKEN>
```

**Response**:
```json
{
  "success": true,
  "verified": 3,
  "failed": 1,
  "total": 4
}
```

**Arquivos**: `frontend/pages/api/cron/verify-nameservers.ts`

---

## 🎨 Componente React

### `DigitalOceanDNSManager`

**Localização**: `frontend/components/domains/DigitalOceanDNSManager.tsx`

**Props**:
```typescript
interface Props {
  brokerId: string; // UUID do broker logado
}
```

**Estados**:
1. `input`: Cliente insere domínio
2. `waiting`: Aguardando configuração de nameservers
3. `active`: Domínio ativo + painel de DNS

**Funcionalidades**:
- ✅ Input de domínio com validação
- ✅ Exibição de nameservers para configurar
- ✅ Verificação automática a cada 5 minutos
- ✅ Adicionar registros MX (email)
- ✅ Adicionar subdomínios (CNAME)
- ✅ Listar registros existentes
- ✅ Copiar nameservers com um clique

### Integração no Painel

Editar `frontend/pages/dashboard/website.tsx`:

```tsx
import { DigitalOceanDNSManager } from '@/components/domains/DigitalOceanDNSManager';

// Dentro do componente
<DigitalOceanDNSManager brokerId={user.id} />
```

---

## ⏰ Cron Job de Verificação

### Configuração no Digital Ocean

1. **Acesse App Platform** → Sua aplicação
2. **Jobs** → **Create Job**
3. **Configurações**:
   - **Name**: `verify-nameservers`
   - **Schedule**: `*/5 * * * *` (a cada 5 minutos)
   - **Command**: 
     ```bash
     curl -X POST https://seuapp.ondigitalocean.app/api/cron/verify-nameservers \
       -H "Authorization: Bearer $CRON_SECRET_TOKEN"
     ```

### Alternativa: Serviço Externo

Usar **cron-job.org**:

1. Criar conta em https://cron-job.org
2. Criar novo job:
   - **URL**: `https://seuapp.ondigitalocean.app/api/cron/verify-nameservers`
   - **Schedule**: A cada 5 minutos
   - **Headers**: `Authorization: Bearer seu-token`
   - **Method**: POST

### Lógica do Cron

```typescript
// Para cada zona com status 'verifying':
1. Consultar Google DNS API para verificar nameservers
2. Se nameservers incluem 'digitalocean.com':
   → Atualizar status para 'active'
   → Registrar activated_at
3. Se não:
   → Incrementar verification_attempts
   → Se > 288 tentativas (24h): marcar como 'failed'
```

---

## 🧪 Testes

### Teste Completo

```bash
# 1. Adicionar domínio
curl -X POST http://localhost:3000/api/domains/do-create-zone \
  -H "Content-Type: application/json" \
  -d '{
    "brokerId": "seu-broker-uuid",
    "domain": "maisexpansaodeconsciencia.site"
  }'

# Resposta: nameservers para configurar

# 2. Configurar nameservers no registrador
# (Fazer manualmente no painel GoDaddy/Hostinger)

# 3. Verificar propagação (manual)
curl -X POST http://localhost:3000/api/domains/do-verify-nameservers \
  -H "Content-Type: application/json" \
  -d '{"domain": "maisexpansaodeconsciencia.site"}'

# 4. Adicionar registro MX (quando ativo)
curl -X POST http://localhost:3000/api/domains/do-add-record \
  -H "Content-Type: application/json" \
  -d '{
    "zoneId": "uuid-da-zona",
    "recordType": "MX",
    "name": "@",
    "value": "ASPMX.L.GOOGLE.COM",
    "priority": 1
  }'

# 5. Listar registros
curl http://localhost:3000/api/domains/do-list-records?zoneId=uuid-da-zona
```

### Verificar Nameservers Manualmente

```bash
# Via Google DNS
curl "https://dns.google/resolve?name=maisexpansaodeconsciencia.site&type=NS"

# Via dig
dig NS maisexpansaodeconsciencia.site

# Via nslookup
nslookup -type=NS maisexpansaodeconsciencia.site
```

---

## 🛠️ Troubleshooting

### Problema: Zona não ativa após 24h

**Causas possíveis**:
1. Cliente não configurou nameservers no registrador
2. Domínio não está registrado
3. Registrador tem lock de DNS ativo

**Solução**:
```sql
-- Verificar status no banco
SELECT domain, status, verification_attempts, last_verification_at
FROM dns_zones
WHERE status = 'failed';

-- Resetar para nova tentativa
UPDATE dns_zones
SET status = 'verifying', verification_attempts = 0
WHERE id = 'uuid-da-zona';
```

---

### Problema: Erro ao criar zona no DO

**Mensagem**: `Domain already exists`

**Causa**: Zona já existe no Digital Ocean

**Solução**:
```bash
# Listar zonas existentes
curl -X GET "https://api.digitalocean.com/v2/domains" \
  -H "Authorization: Bearer $DO_ACCESS_TOKEN"

# Deletar zona duplicada
curl -X DELETE "https://api.digitalocean.com/v2/domains/dominio.com" \
  -H "Authorization: Bearer $DO_ACCESS_TOKEN"
```

---

### Problema: Cron não está rodando

**Verificar logs no Digital Ocean**:

```bash
# Via DO CLI
doctl apps logs <app-id> --type job --job verify-nameservers

# Via Dashboard
App Platform > Logs > Filter by "verify-nameservers"
```

**Testar manualmente**:
```bash
curl -X POST https://seuapp.ondigitalocean.app/api/cron/verify-nameservers \
  -H "Authorization: Bearer $CRON_SECRET_TOKEN"
```

---

### Problema: Cliente não consegue adicionar MX

**Mensagem**: `Zone is not active yet`

**Causa**: Nameservers ainda não propagaram

**Solução**:
1. Verificar se cliente configurou nameservers corretamente
2. Aguardar propagação (pode levar até 48h)
3. Forçar verificação manual:
   ```bash
   curl -X POST /api/domains/do-verify-nameservers \
     -d '{"domain": "dominio.com"}'
   ```

---

## 📊 Monitoramento

### Queries Úteis

```sql
-- Zonas ativas
SELECT COUNT(*) as total_ativas
FROM dns_zones
WHERE status = 'active';

-- Zonas aguardando verificação
SELECT domain, verification_attempts, 
       last_verification_at, created_at
FROM dns_zones
WHERE status = 'verifying'
ORDER BY verification_attempts DESC;

-- Registros DNS mais comuns
SELECT record_type, COUNT(*) as total
FROM dns_records
GROUP BY record_type
ORDER BY total DESC;

-- Tempo médio de ativação
SELECT AVG(EXTRACT(EPOCH FROM (activated_at - created_at)) / 3600) as avg_hours
FROM dns_zones
WHERE status = 'active' AND activated_at IS NOT NULL;
```

---

## 🎯 Próximos Passos

1. ✅ **Executar SQL** no Supabase
2. ✅ **Configurar variáveis** de ambiente
3. ✅ **Deploy** no Digital Ocean
4. ✅ **Configurar cron job** para verificação automática
5. ✅ **Testar** com domínio `maisexpansaodeconsciencia.site`
6. 📝 **Criar tutorial** em vídeo para clientes
7. 📧 **Documentar** configuração de email (Gmail, Outlook)

---

## 📚 Referências

- [Digital Ocean DNS API](https://docs.digitalocean.com/reference/api/api-reference/#tag/Domains)
- [Google DNS API](https://developers.google.com/speed/public-dns/docs/doh)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)

---

**Sistema desenvolvido para AdminImobiliaria SaaS**  
Arquitetura: Digital Ocean DNS + Nameserver Delegation  
Zero configuração manual | 100% automatizado
