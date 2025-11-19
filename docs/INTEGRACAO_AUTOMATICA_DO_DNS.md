# 🔄 INTEGRAÇÃO AUTOMÁTICA: SaaS ↔ Digital Ocean Networking

## ✅ CONFIRMAÇÃO: Sim, está 100% automático!

Quando você **adiciona** ou **exclui** um domínio no seu SaaS, a mudança é **automaticamente refletida** no painel de Networking do Digital Ocean.

---

## 📋 FLUXO COMPLETO - ADICIONAR DOMÍNIO

### 1️⃣ Cliente adiciona domínio no SaaS
```
Dashboard → Aba "Domínio" → Digite "meudominio.com.br" → Configurar Domínio
```

### 2️⃣ API `do-create-zone` é chamada
**Arquivo:** `frontend/pages/api/domains/do-create-zone.ts`

**O que acontece automaticamente:**

```typescript
// 🌐 CRIA ZONA NO DIGITAL OCEAN
POST https://api.digitalocean.com/v2/domains
{
  "name": "meudominio.com.br",
  "ip_address": "162.159.140.98" // IP do seu app
}

// ✅ Resultado: Zona aparece no painel Networking → Domains
```

### 3️⃣ Registros DNS são criados automaticamente
```typescript
// 📝 ADICIONA REGISTRO WWW
POST https://api.digitalocean.com/v2/domains/meudominio.com.br/records
{
  "type": "CNAME",
  "name": "www",
  "data": "whale-app-w84mh.ondigitalocean.app."
}

// 📝 ADICIONA REGISTRO WILDCARD (*)
POST https://api.digitalocean.com/v2/domains/meudominio.com.br/records
{
  "type": "CNAME", 
  "name": "*",
  "data": "whale-app-w84mh.ondigitalocean.app."
}

// ✅ Resultado: Registros aparecem dentro da zona no painel DO
```

### 4️⃣ Zona é salva no banco Supabase
```sql
INSERT INTO dns_zones (
  broker_id, 
  domain, 
  status, -- 'verifying'
  nameservers -- ['ns1.digitalocean.com', 'ns2...', 'ns3...']
)
```

### 5️⃣ Cliente vê os nameservers no SaaS
```
🟡 Aguardando Configuração dos Nameservers
📋 Adicione no seu registrador:
   - ns1.digitalocean.com
   - ns2.digitalocean.com  
   - ns3.digitalocean.com
```

---

## 🗑️ FLUXO COMPLETO - EXCLUIR DOMÍNIO

### 1️⃣ Cliente clica em "Remover Domínio" no SaaS
```
Dashboard → Aba "Domínio" → Remover Domínio → Confirmar
```

### 2️⃣ API `do-delete-zone` é chamada
**Arquivo:** `frontend/pages/api/domains/do-delete-zone.ts`

**O que acontece automaticamente:**

```typescript
// 🗑️ DELETA ZONA NO DIGITAL OCEAN
DELETE https://api.digitalocean.com/v2/domains/meudominio.com.br

// ✅ Resultado: Zona DESAPARECE do painel Networking → Domains
// ✅ Todos os registros DNS dentro dela também são deletados
```

### 3️⃣ Registros DNS são deletados do banco
```sql
DELETE FROM dns_records WHERE zone_id = 'xxx';
```

### 4️⃣ Zona é deletada do banco
```sql
DELETE FROM dns_zones WHERE id = 'xxx';
-- 🔔 Trigger automático limpa custom_domain no broker
```

### 5️⃣ Custom domain é limpo automaticamente
```sql
-- Executado pelo TRIGGER
UPDATE brokers 
SET custom_domain = NULL 
WHERE id = 'broker_id';
```

---

## 🔍 VERIFICAÇÃO NO DIGITAL OCEAN

### Onde ver no painel DO:

1. **Acesse:** https://cloud.digitalocean.com/networking/domains
2. **Você verá:**
   - ✅ `adminimobiliaria.site` (domínio principal)
   - ✅ `maisexpansaodeconsciencia.site` (adicionado via SaaS)

3. **Clique no domínio** para ver:
   - 📝 1 registro A (apontando para 162.159.140.98)
   - 📝 1 registro CNAME (www)
   - 📝 3 registros NS (nameservers)
   - 📝 1 registro SOA (autoridade)

---

## 🎯 SINCRONIZAÇÃO EM TEMPO REAL

| Ação no SaaS | O que acontece no DO Networking | Tempo |
|--------------|--------------------------------|-------|
| ➕ Adicionar domínio | Zona é criada + 2 registros (www, *) | Instantâneo |
| ➕ Adicionar registro MX | Novo registro MX aparece na zona | Instantâneo |
| ➕ Adicionar registro CNAME | Novo registro CNAME aparece na zona | Instantâneo |
| 🗑️ Remover domínio | Zona inteira é deletada | Instantâneo |
| ✅ Nameservers verificados | Status muda para "active" | 5-48h (propagação DNS) |

---

## 🔐 COMO FUNCIONA A AUTENTICAÇÃO

O sistema usa o **DO_ACCESS_TOKEN** configurado no Digital Ocean App Platform:

```env
DO_ACCESS_TOKEN=dop_v1_xxxxxxxxxxxxx
```

Este token tem permissão para:
- ✅ Criar zonas DNS (`POST /v2/domains`)
- ✅ Adicionar registros DNS (`POST /v2/domains/{domain}/records`)
- ✅ Listar zonas (`GET /v2/domains`)
- ✅ Deletar zonas (`DELETE /v2/domains/{domain}`)

---

## 📊 EXEMPLO VISUAL

### Antes de adicionar:
```
Digital Ocean Networking → Domains
┌─────────────────────────────┐
│ adminimobiliaria.site       │ ← Domínio principal do app
└─────────────────────────────┘
```

### Cliente adiciona "exemplo.com.br" no SaaS:
```
Digital Ocean Networking → Domains
┌─────────────────────────────┐
│ adminimobiliaria.site       │
├─────────────────────────────┤
│ exemplo.com.br              │ ← ✨ APARECE AUTOMATICAMENTE
│  ├─ 1 A                     │
│  ├─ 1 CNAME (www)           │
│  ├─ 1 CNAME (*)             │
│  └─ 3 NS                    │
└─────────────────────────────┘
```

### Cliente remove "exemplo.com.br" no SaaS:
```
Digital Ocean Networking → Domains
┌─────────────────────────────┐
│ adminimobiliaria.site       │
└─────────────────────────────┘
                                ← 🗑️ DESAPARECE AUTOMATICAMENTE
```

---

## ✅ CONCLUSÃO

**SIM**, está completamente automático:

- ✅ Adicionar no SaaS = Adiciona no DO Networking
- ✅ Excluir no SaaS = Exclui no DO Networking
- ✅ Adicionar registro DNS = Aparece no DO
- ✅ Status sincronizado entre banco e DO
- ✅ Triggers no banco mantêm `custom_domain` atualizado

**Não precisa fazer NADA manualmente no painel do Digital Ocean!** 🎉

---

## 🔧 APIs Responsáveis

| API | Endpoint DO | Ação |
|-----|-------------|------|
| `do-create-zone.ts` | `POST /v2/domains` | Cria zona |
| `do-add-record.ts` | `POST /v2/domains/{domain}/records` | Adiciona registro |
| `do-delete-zone.ts` | `DELETE /v2/domains/{domain}` | Remove zona |
| `do-list-records.ts` | `GET /v2/domains/{domain}/records` | Lista registros |
| `do-verify-nameservers.ts` | Usa Google DNS API | Verifica propagação |
| `cron/verify-nameservers.ts` | Verifica a cada 5 min | Ativa automaticamente |
