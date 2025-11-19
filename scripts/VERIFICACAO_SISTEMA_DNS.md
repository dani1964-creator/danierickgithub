# ✅ Checklist de Verificação - Sistema DNS Digital Ocean

Execute esta verificação **APÓS** configurar as variáveis de ambiente no Digital Ocean e executar o SQL no Supabase.

---

## 📋 Pré-requisitos

### 1. Variáveis de Ambiente Configuradas no Digital Ocean

Acesse: **App Platform → Settings → Environment Variables**

```env
✅ DO_ACCESS_TOKEN=dop_v1_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
✅ NEXT_PUBLIC_APP_IP=162.159.140.98
✅ CRON_SECRET_TOKEN=eb608eef4671278cae382fab39bfa34a68947477bef5c80fb84965204452e15f
✅ SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Como obter:**
- `DO_ACCESS_TOKEN`: https://cloud.digitalocean.com/account/api/tokens → Generate New Token
- `NEXT_PUBLIC_APP_IP`: App Platform → Settings → Domains (IP do app)
- `CRON_SECRET_TOKEN`: Já gerado → `eb608eef4671278cae382fab39bfa34a68947477bef5c80fb84965204452e15f`
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase Dashboard → Settings → API → service_role key

### 2. SQL Executado no Supabase

```bash
✅ SQL Editor → Cole o conteúdo de scripts/SETUP_DNS_ZONES_DIGITAL_OCEAN.sql → Run
```

---

## 🔍 Verificações

### ✅ 1. Verificar Tabelas no Supabase

Acesse: **Supabase Dashboard → Table Editor**

Deve aparecer:
- ✅ `dns_zones` (com colunas: id, broker_id, domain, status, nameservers, etc)
- ✅ `dns_records` (com colunas: id, zone_id, record_type, name, value, priority, ttl)

### ✅ 2. Verificar RLS Policies

Acesse: **Supabase Dashboard → Authentication → Policies**

Deve ter:
- ✅ `dns_zones`: 2 policies (SELECT, INSERT)
- ✅ `dns_records`: 3 policies (SELECT, INSERT, DELETE)

### ✅ 3. Testar API de Criação de Zona

```bash
# Substitua os valores reais
curl -X POST https://SEU_APP.ondigitalocean.app/api/domains/do-create-zone \
  -H "Content-Type: application/json" \
  -d '{
    "brokerId": "UUID_DO_BROKER",
    "domain": "teste-dns-sistema.com"
  }'
```

**Resposta esperada:**
```json
{
  "success": true,
  "zoneId": "uuid...",
  "domain": "teste-dns-sistema.com",
  "nameservers": [
    "ns1.digitalocean.com",
    "ns2.digitalocean.com",
    "ns3.digitalocean.com"
  ],
  "instructions": "Configure os nameservers..."
}
```

**Erros comuns:**
- ❌ `Domain already exists` → Zona já existe no DO, delete antes
- ❌ `401 Unauthorized` → DO_ACCESS_TOKEN inválido
- ❌ `Broker not found` → brokerId errado
- ❌ `Missing DO_ACCESS_TOKEN` → Variável não configurada

### ✅ 4. Verificar Zona Criada no Digital Ocean

Acesse: https://cloud.digitalocean.com/networking/domains

Deve aparecer:
- ✅ Domínio `teste-dns-sistema.com`
- ✅ Registros automáticos criados:
  - CNAME `www` → `adminimobiliaria.site`
  - CNAME `*` → `adminimobiliaria.site` (wildcard)

### ✅ 5. Verificar Zona no Banco de Dados

```sql
-- Execute no Supabase SQL Editor
SELECT * FROM dns_zones ORDER BY created_at DESC LIMIT 5;
```

**Resultado esperado:**
```
id                  | broker_id | domain                  | status    | nameservers
--------------------|-----------|-------------------------|-----------|-------------
uuid...             | uuid...   | teste-dns-sistema.com   | verifying | {ns1.digitalocean.com,...}
```

### ✅ 6. Testar API de Verificação (Manual)

```bash
curl -X POST https://SEU_APP.ondigitalocean.app/api/domains/do-verify-nameservers \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "teste-dns-sistema.com"
  }'
```

**Resposta (nameservers não configurados):**
```json
{
  "isActive": false,
  "nameserversDetected": [],
  "message": "Nameservers ainda não foram configurados..."
}
```

### ✅ 7. Testar Cron Job (Protegido)

```bash
# SEM token (deve retornar 401)
curl -X POST https://SEU_APP.ondigitalocean.app/api/cron/verify-nameservers

# Resposta esperada: {"error": "Unauthorized"}

# COM token correto
curl -X POST https://SEU_APP.ondigitalocean.app/api/cron/verify-nameservers \
  -H "Authorization: Bearer eb608eef4671278cae382fab39bfa34a68947477bef5c80fb84965204452e15f"
```

**Resposta esperada:**
```json
{
  "success": true,
  "message": "Verificação concluída",
  "verified": 0,
  "failed": 0,
  "total": 1
}
```

### ✅ 8. Testar API de Adicionar Registro

```bash
curl -X POST https://SEU_APP.ondigitalocean.app/api/domains/do-add-record \
  -H "Content-Type: application/json" \
  -d '{
    "zoneId": "UUID_DA_ZONA",
    "recordType": "MX",
    "name": "@",
    "value": "ASPMX.L.GOOGLE.COM",
    "priority": 1
  }'
```

**Resposta esperada:**
```json
{
  "success": true,
  "record": {
    "id": "uuid...",
    "record_type": "MX",
    "name": "@",
    "value": "ASPMX.L.GOOGLE.COM",
    "priority": 1
  }
}
```

**Erro comum:**
- ❌ `Zone is not active yet` → Zona ainda não está ativa (nameservers não configurados)

### ✅ 9. Verificar Componente React no Frontend

Acesse: **Dashboard → Configurações do Site → Aba "Domínio"**

Deve aparecer:
- ✅ Campo para adicionar domínio
- ✅ Botão "Configurar Domínio"
- ✅ Instruções de nameservers após adicionar
- ✅ Status de verificação

### ✅ 10. Testar Fluxo Completo (com domínio real)

1. **Adicionar domínio** via painel: `maisexpansaodeconsciencia.site`
2. **Copiar nameservers** fornecidos
3. **Configurar no GoDaddy**:
   - Tipo: Nameservers Personalizados
   - Adicionar os 3 nameservers do Digital Ocean
4. **Aguardar 5-10 minutos**
5. **Clicar em "Verificar Agora"**
6. **Status deve mudar para "Ativo"** ✅
7. **Adicionar registro MX** para email
8. **Verificar no DO**: Registro deve aparecer

---

## 🚨 Troubleshooting

### Erro: "Missing DO_ACCESS_TOKEN"
**Solução**: Configurar variável no Digital Ocean App Platform

### Erro: "Column dns_zones does not exist"
**Solução**: Executar SQL no Supabase

### Erro: "Broker not found"
**Solução**: Usar brokerId válido da tabela `brokers`

### Erro: "Domain already exists in Digital Ocean"
**Solução**: Deletar zona duplicada no DO:
```bash
curl -X DELETE "https://api.digitalocean.com/v2/domains/dominio.com" \
  -H "Authorization: Bearer $DO_ACCESS_TOKEN"
```

### Erro: "Unauthorized" no cron job
**Solução**: Verificar se CRON_SECRET_TOKEN está configurado corretamente

### Zona não ativa após 24h
**Solução**: 
1. Verificar se nameservers foram configurados no registrador
2. Verificar propagação: `dig NS dominio.com`
3. Resetar tentativas: `UPDATE dns_zones SET verification_attempts = 0, status = 'verifying' WHERE domain = 'dominio.com'`

---

## ✅ Checklist Final

Antes de considerar o sistema pronto para produção:

- [ ] SQL executado no Supabase
- [ ] Tabelas `dns_zones` e `dns_records` existem
- [ ] RLS policies configuradas
- [ ] Variáveis de ambiente no Digital Ocean
- [ ] API `/api/domains/do-create-zone` funciona
- [ ] Zona criada no Digital Ocean
- [ ] Registros automáticos (www, wildcard) criados
- [ ] API `/api/domains/do-verify-nameservers` funciona
- [ ] API `/api/domains/do-add-record` funciona
- [ ] API `/api/domains/do-list-records` funciona
- [ ] Cron job protegido com token
- [ ] Componente React aparece no painel
- [ ] Fluxo completo testado com domínio real

---

## 📊 Comandos Úteis para Monitoramento

### Listar zonas pendentes
```sql
SELECT domain, status, verification_attempts, last_verification_at
FROM dns_zones
WHERE status = 'verifying'
ORDER BY verification_attempts DESC;
```

### Zonas ativas
```sql
SELECT COUNT(*) FROM dns_zones WHERE status = 'active';
```

### Registros DNS mais usados
```sql
SELECT record_type, COUNT(*) as total
FROM dns_records
GROUP BY record_type
ORDER BY total DESC;
```

### Tempo médio de ativação
```sql
SELECT AVG(EXTRACT(EPOCH FROM (activated_at - created_at)) / 3600) as avg_hours
FROM dns_zones
WHERE status = 'active' AND activated_at IS NOT NULL;
```

---

**Sistema pronto quando todos os itens estiverem ✅!**
