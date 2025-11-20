# Automação Completa de Domínios Personalizados

## ✅ Sistema Implementado

O sistema agora funciona **100% automaticamente**:

1. **Cliente solicita domínio personalizado** → Cria zona DNS no Digital Ocean
2. **Sistema verifica nameservers a cada 5 minutos** → Cron job automático
3. **Domínio verificado** → Ativa na database + **Adiciona ao App Platform automaticamente**
4. **App Platform provisiona SSL** → Certificado Let's Encrypt em 5-15 minutos

## 🔧 Configuração Necessária

### 1. Adicionar Variável de Ambiente no Digital Ocean

**IMPORTANTE:** Para a automação funcionar, você precisa adicionar o `DO_APP_ID`:

1. Acesse: https://cloud.digitalocean.com/apps
2. Clique em **whale-app**
3. Copie o ID do app da URL (ex: `c9a1a9c8-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)
4. Vá em **Settings → App-Level Environment Variables**
5. Clique em **Edit** e adicione:

```
DO_APP_ID = c9a1a9c8-xxxx-xxxx-xxxx-xxxxxxxxxxxx
Encrypted: NO
Scope: RUN_AND_BUILD_TIME
```

### 2. Variáveis já configuradas ✅

- ✅ `DO_ACCESS_TOKEN` - Token de API do Digital Ocean
- ✅ `CRON_SECRET_TOKEN` - Segurança do cron job
- ✅ `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` - Database

## 📋 Como Obter o DO_APP_ID

### Opção 1: Pela URL do App
1. Acesse https://cloud.digitalocean.com/apps
2. Clique no app **whale-app**
3. A URL será algo como: `https://cloud.digitalocean.com/apps/c9a1a9c8-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
4. Copie o ID (último segmento da URL)

### Opção 2: Via API (Terminal)
```bash
curl -X GET \
  -H "Authorization: Bearer $DO_ACCESS_TOKEN" \
  "https://api.digitalocean.com/v2/apps" | jq -r '.apps[] | select(.spec.name=="whale-app") | .id'
```

### Opção 3: Via doctl CLI
```bash
doctl apps list --format ID,Spec.Name | grep whale-app
```

## 🔄 Fluxo Automático

```
Cliente configura nameservers
    ↓
Cron verifica a cada 5 minutos (Digital Ocean Function)
    ↓
Nameservers validados via Google DNS API
    ↓
Database atualizada (status: 'active')
    ↓
🆕 AUTOMÁTICO: POST /api/domains/do-add-to-app
    ↓
Domínio + www.domínio adicionados ao App Platform
    ↓
Digital Ocean provisiona SSL Let's Encrypt
    ↓
✅ Site HTTPS funcionando em 5-15 minutos
```

## 📁 Arquivos Criados/Modificados

### Novo Arquivo
- `frontend/pages/api/domains/do-add-to-app.ts` - Adiciona domínio ao App Platform

### Modificado
- `frontend/pages/api/cron/verify-nameservers.ts` - Agora chama `do-add-to-app` automaticamente

## 🧪 Teste Manual

### 1. Testar adição de domínio ao App Platform:
```bash
curl -X POST https://whale-app-w84mh.ondigitalocean.app/api/domains/do-add-to-app \
  -H "Content-Type: application/json" \
  -d '{"domain":"imobideps.com"}'
```

**Resposta esperada:**
```json
{
  "success": true,
  "message": "Domain added to App Platform successfully",
  "domain": "imobideps.com",
  "www": "www.imobideps.com",
  "note": "SSL certificate will be provisioned automatically by Let's Encrypt (5-15 minutes)"
}
```

### 2. Testar cron completo (verifica + adiciona):
```bash
curl -X POST https://whale-app-w84mh.ondigitalocean.app/api/cron/verify-nameservers \
  -H "Authorization: Bearer eb608eef4671278cae382fab39bfa34a68947477bef5c80fb84965204452e15f"
```

## ⚠️ Importante

1. **Sem DO_APP_ID:** O sistema ainda funcionará parcialmente (DNS + Database), mas **não adicionará domínio ao App Platform automaticamente** = SSL não será provisionado
2. **Com DO_APP_ID:** Sistema 100% automático - do nameserver ao SSL, zero intervenção manual
3. **Verificação:** Após adicionar `DO_APP_ID`, execute o teste manual acima para confirmar

## 🎯 Resultado Final

Após configurar `DO_APP_ID`:
- ✅ Cliente configura nameservers
- ✅ Aguarda 5-20 minutos
- ✅ Site HTTPS funcionando automaticamente
- ✅ **Zero intervenção manual do administrador**

## 📊 Monitoramento

Verificar logs do cron para confirmar funcionamento:
```sql
-- Verificar domínios em processo
SELECT domain, status, verification_attempts, last_verification_at 
FROM dns_zones 
WHERE status IN ('verifying', 'active')
ORDER BY last_verification_at DESC;

-- Verificar domínios ativados hoje
SELECT d.domain, d.activated_at, b.custom_domain, b.nome_fantasia
FROM dns_zones d
LEFT JOIN brokers b ON d.broker_id = b.id
WHERE d.status = 'active' 
AND d.activated_at::date = CURRENT_DATE;
```

Logs do App Platform mostrarão:
```
[CRON] ✅ Zona imobideps.com verificada com sucesso!
[CRON] 🔒 Adicionando imobideps.com ao App Platform para SSL...
[CRON] ✅ Domínio imobideps.com adicionado ao App Platform: Domain added successfully
```
