# 🔍 Checklist: Por que o Domínio Personalizado Não Ativa?

## 📋 Checklist de Verificação

### 1️⃣ **Banco de Dados - Tabelas e Estrutura**
```sql
-- Execute no Supabase SQL Editor:
-- Ver script completo: /scripts/diagnostico-dominio-completo.sql
```

**Verificar:**
- [ ] Tabela `dns_zones` existe
- [ ] Tabela `dns_records` existe
- [ ] Coluna `brokers.custom_domain` existe
- [ ] Triggers de sincronização existem

**Como verificar:**
```sql
-- 1. Verificar estrutura
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name IN ('dns_zones', 'dns_records');

-- 2. Verificar dados
SELECT * FROM dns_zones ORDER BY created_at DESC LIMIT 5;
```

---

### 2️⃣ **Scripts SQL - Foram Executados?**

**Scripts obrigatórios:**
- [ ] `SETUP_DNS_ZONES_DIGITAL_OCEAN.sql` - Cria tabelas
- [ ] `ATUALIZAR_CUSTOM_DOMAIN_AUTOMATICO.sql` - Cria triggers

**Como executar:**
1. Abrir Supabase Dashboard → SQL Editor
2. Copiar conteúdo do script
3. Executar (Run)
4. Verificar se não houve erros

---

### 3️⃣ **Digital Ocean - Configuração**

**Variáveis de ambiente configuradas:**
- [ ] `DO_ACCESS_TOKEN` - Token de API do Digital Ocean
- [ ] `DO_APP_ID` - ID do app (opcional, não usado no DNS)
- [ ] `CRON_SECRET_TOKEN` - Token para cron job
- [ ] `NEXT_PUBLIC_CNAME_TARGET=whale-app-w84mh.ondigitalocean.app`

**Como verificar:**
```typescript
// No dashboard, acessar Environment Variables e confirmar
```

---

### 4️⃣ **Zona DNS - Criação**

**Quando cliente adiciona domínio:**
1. [ ] API `/api/domains/do-create-zone` é chamada
2. [ ] Zona é criada no Digital Ocean
3. [ ] Registros CNAME são adicionados:
   - `www` → `whale-app-w84mh.ondigitalocean.app`
   - `*` (wildcard) → `whale-app-w84mh.ondigitalocean.app`
4. [ ] Zona é salva no banco com status `verifying`

**Como verificar:**
```sql
SELECT domain, status, nameservers, created_at 
FROM dns_zones 
WHERE domain = 'dominio-do-cliente.com';
```

**Deve retornar:**
```
domain: dominio-do-cliente.com
status: verifying
nameservers: [ns1.digitalocean.com, ns2.digitalocean.com, ns3.digitalocean.com]
```

---

### 5️⃣ **Nameservers - Cliente Configurou?**

**Cliente precisa fazer:**
1. [ ] Acessar registrador de domínio (Registro.br, GoDaddy, etc)
2. [ ] Alterar nameservers para:
   - `ns1.digitalocean.com`
   - `ns2.digitalocean.com`
   - `ns3.digitalocean.com`
3. [ ] Aguardar propagação (2-48h)

**Como verificar:**
```bash
# No terminal:
nslookup -type=NS dominio-do-cliente.com
```

**Deve retornar:**
```
dominio-do-cliente.com  nameserver = ns1.digitalocean.com.
dominio-do-cliente.com  nameserver = ns2.digitalocean.com.
dominio-do-cliente.com  nameserver = ns3.digitalocean.com.
```

---

### 6️⃣ **Verificação Automática - Cron Job**

**Sistema deve verificar automaticamente:**
- [ ] Cron job configurado no Digital Ocean
- [ ] Roda a cada 5 minutos
- [ ] Chama `/api/cron/verify-nameservers`

**Como verificar:**
```sql
-- Ver últimas verificações
SELECT 
  domain, 
  status, 
  verification_attempts, 
  last_verification_at 
FROM dns_zones 
WHERE status = 'verifying';
```

**Configurar cron no Digital Ocean:**
```yaml
# No App Platform → Settings → Scheduled Jobs
name: verify-nameservers
schedule: "*/5 * * * *"
command: curl -X POST -H "Authorization: Bearer ${CRON_SECRET_TOKEN}" https://whale-app-w84mh.ondigitalocean.app/api/cron/verify-nameservers
```

---

### 7️⃣ **Ativação - Status Muda para Active**

**Quando nameservers propagam:**
1. [ ] API verifica via Google DNS: `https://dns.google/resolve?name=dominio&type=NS`
2. [ ] Detecta nameservers do Digital Ocean
3. [ ] Atualiza `dns_zones.status = 'active'`
4. [ ] Define `dns_zones.activated_at = NOW()`
5. [ ] **Trigger automático** atualiza `brokers.custom_domain`

**Como verificar:**
```sql
-- Verificar se zona está ativa
SELECT domain, status, activated_at FROM dns_zones WHERE domain = 'dominio-do-cliente.com';

-- Verificar se broker foi atualizado
SELECT b.name, b.custom_domain, z.domain, z.status
FROM brokers b
LEFT JOIN dns_zones z ON b.id = z.broker_id
WHERE z.domain = 'dominio-do-cliente.com';
```

**Deve mostrar:**
```
dns_zones.status = 'active'
dns_zones.activated_at = (timestamp)
brokers.custom_domain = 'dominio-do-cliente.com'
```

---

### 8️⃣ **Trigger de Sincronização - Está Funcionando?**

**Verificar se trigger existe:**
```sql
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table = 'dns_zones'
  AND trigger_name LIKE '%sync%';
```

**Deve retornar:**
```
trigger_sync_custom_domain_on_update | UPDATE | dns_zones
trigger_sync_custom_domain_on_delete | DELETE | dns_zones
```

**Testar trigger manualmente:**
```sql
-- 1. Verificar broker antes
SELECT id, custom_domain FROM brokers WHERE id = 'BROKER_ID_AQUI';

-- 2. Atualizar zona para active
UPDATE dns_zones 
SET status = 'active', activated_at = NOW() 
WHERE domain = 'dominio-teste.com';

-- 3. Verificar broker depois (deve ter custom_domain atualizado)
SELECT id, custom_domain FROM brokers WHERE id = 'BROKER_ID_AQUI';
```

---

## 🐛 Problemas Comuns

### ❌ Problema 1: Zona ativa mas broker sem custom_domain
**Sintoma:** `dns_zones.status = 'active'` mas `brokers.custom_domain IS NULL`

**Causa:** Trigger não foi executado ou não existe

**Solução:**
```sql
-- 1. Executar script do trigger
-- scripts/ATUALIZAR_CUSTOM_DOMAIN_AUTOMATICO.sql

-- 2. Sincronizar manualmente zonas já ativas
UPDATE brokers b
SET custom_domain = z.domain
FROM dns_zones z
WHERE b.id = z.broker_id 
  AND z.status = 'active'
  AND (b.custom_domain IS NULL OR b.custom_domain != z.domain);
```

---

### ❌ Problema 2: Zona fica em "verifying" indefinidamente
**Sintoma:** `dns_zones.status = 'verifying'` por mais de 48h

**Causa possível:**
1. Cliente não configurou nameservers
2. Nameservers configurados errados
3. Cron job não está rodando
4. Propagação DNS lenta

**Solução:**
```bash
# 1. Verificar nameservers atuais
nslookup -type=NS dominio-do-cliente.com

# 2. Verificar se cron está rodando
# Ver logs do cron job no Digital Ocean

# 3. Forçar verificação manual
curl -X POST -H "Content-Type: application/json" \
  -d '{"domain":"dominio-do-cliente.com"}' \
  https://seuapp.com/api/domains/do-verify-nameservers
```

---

### ❌ Problema 3: Registros CNAME não foram criados
**Sintoma:** Zona existe mas sem registros DNS

**Solução:**
```sql
-- Verificar registros
SELECT dr.* FROM dns_records dr
JOIN dns_zones dz ON dr.zone_id = dz.id
WHERE dz.domain = 'dominio-do-cliente.com';

-- Se não existir, criar manualmente via API ou Digital Ocean Dashboard
```

---

## ✅ Ordem de Execução (Setup Inicial)

### Primeira vez configurando o sistema:

1. **Executar no Supabase:**
   ```sql
   -- 1. Criar tabelas
   -- Executar: scripts/SETUP_DNS_ZONES_DIGITAL_OCEAN.sql
   
   -- 2. Criar triggers
   -- Executar: scripts/ATUALIZAR_CUSTOM_DOMAIN_AUTOMATICO.sql
   ```

2. **Configurar no Digital Ocean:**
   - Adicionar variáveis de ambiente
   - Criar Cron Job para `/api/cron/verify-nameservers`

3. **Testar com domínio de teste:**
   - Adicionar domínio via dashboard
   - Configurar nameservers
   - Aguardar ativação
   - Verificar se `custom_domain` foi atualizado

---

## 📊 Query de Diagnóstico Rápido

```sql
-- EXECUTAR ISTO PRIMEIRO para ver status geral:
SELECT 
  'Zonas DNS' AS tipo,
  COUNT(*) FILTER (WHERE status = 'active') AS ativas,
  COUNT(*) FILTER (WHERE status = 'verifying') AS verificando,
  COUNT(*) FILTER (WHERE status = 'failed') AS falhas,
  COUNT(*) AS total
FROM dns_zones
UNION ALL
SELECT 
  'Brokers com domínio',
  COUNT(*) FILTER (WHERE custom_domain IS NOT NULL),
  NULL,
  NULL,
  COUNT(*)
FROM brokers;
```

---

## 🚀 Próximos Passos

**Execute agora:**
1. ✅ Remover APIs obsoletas (FEITO)
2. 📝 Executar `/scripts/diagnostico-dominio-completo.sql` no Supabase
3. 🔍 Analisar resultados e identificar o problema específico
4. 🔧 Aplicar correção baseada no problema encontrado
