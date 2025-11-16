# Configuração do Supabase - Sistema de Trial

## 📋 Checklist de Configuração

### 1. ✅ Migrations (Banco de Dados)

Execute as migrations na ordem:

```bash
# 1. Sistema de assinaturas (já deve existir)
supabase/migrations/20251115000000_create_subscription_system.sql

# 2. Campo trial_ends_at (NOVA - executar agora)
supabase/migrations/20251116000000_add_trial_ends_at.sql
```

**Como aplicar:**
1. Acesse o Dashboard do Supabase: https://supabase.com/dashboard
2. Vá em **Database** > **Migrations**
3. Clique em **New Migration**
4. Cole o conteúdo do arquivo `20251116000000_add_trial_ends_at.sql`
5. Clique em **Run Migration**

Ou via CLI:
```bash
supabase db push
```

---

### 2. 🔧 Edge Functions

#### A) Deploy da função `send-welcome-email`

```bash
# No terminal do projeto
cd supabase

# Deploy da função
supabase functions deploy send-welcome-email

# Verificar se foi deployada
supabase functions list
```

#### B) Configurar variáveis de ambiente

No Dashboard do Supabase:
1. Vá em **Edge Functions** > **send-welcome-email**
2. Clique em **Settings** > **Secrets**
3. Adicione:
   ```
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   ```

**Obter API Key da Resend:**
1. Acesse: https://resend.com/api-keys
2. Crie uma nova API Key
3. Cole no Supabase

---

### 3. 🔐 Variáveis de Ambiente (Backend)

No arquivo `.env` ou no Vercel/Railway:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Email (Resend) - opcional se usar Edge Function
RESEND_API_KEY=re_xxxxxxxxxxxxx
```

---

### 4. 📧 Configuração de Email (Resend.com)

1. **Criar conta:** https://resend.com
2. **Verificar domínio:**
   - Adicione domínio: `adminimobiliaria.com`
   - Configure DNS records (SPF, DKIM)
   - Aguarde verificação (~10 min)

3. **Configurar email remetente:**
   - From: `onboarding@adminimobiliaria.com`
   - From Name: `AdminImobiliaria`

---

### 5. 🔒 Row Level Security (RLS)

Verificar se as policies estão ativas:

```sql
-- Verificar RLS na tabela brokers
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'brokers';

-- Se não estiver ativo, ativar:
ALTER TABLE public.brokers ENABLE ROW LEVEL SECURITY;

-- Policy para trial_ends_at (broker vê apenas seus dados)
CREATE POLICY "Brokers can view own trial status"
ON public.brokers
FOR SELECT
TO authenticated
USING (user_id = auth.uid());
```

---

### 6. 🧪 Testar Sistema

#### Teste 1: Cadastro com Trial
```bash
# Acessar página de cadastro
https://seu-dominio.com/cadastro

# Preencher formulário
# Verificar se:
# - Usuário criado no Auth
# - Broker criado com trial_ends_at
# - Subscription criada com status=trial
# - Email de boas-vindas enviado
```

#### Teste 2: Banner de Trial
```bash
# Fazer login
# Verificar se banner aparece no dashboard
# Confirmar dias restantes corretos
```

#### Teste 3: Proteção de Trial Expirado
```bash
# Manualmente alterar trial_ends_at para data passada:
UPDATE brokers 
SET trial_ends_at = NOW() - INTERVAL '1 day'
WHERE email = 'seu-email@teste.com';

# Fazer login
# Deve redirecionar para /upgrade
```

---

### 7. 📊 Queries Úteis para Debug

```sql
-- Ver todos os trials ativos
SELECT 
  b.business_name,
  b.email,
  b.trial_ends_at,
  EXTRACT(DAY FROM (b.trial_ends_at - NOW())) as days_remaining,
  s.status
FROM brokers b
LEFT JOIN subscriptions s ON s.broker_id = b.id
WHERE b.trial_ends_at IS NOT NULL
ORDER BY b.trial_ends_at;

-- Ver trials expirados
SELECT 
  b.business_name,
  b.email,
  b.trial_ends_at
FROM brokers b
WHERE b.trial_ends_at < NOW()
AND b.trial_ends_at IS NOT NULL;

-- Ver comprovantes de pagamento pendentes
SELECT 
  sc.*,
  b.business_name,
  b.email
FROM subscription_communications sc
JOIN brokers b ON sc.broker_id = b.id
WHERE sc.subject LIKE '%Comprovante%'
AND sc.is_read = false
ORDER BY sc.created_at DESC;
```

---

### 8. 🚀 Deploy Checklist

- [ ] Migrations aplicadas no Supabase
- [ ] Edge Function deployada
- [ ] RESEND_API_KEY configurada
- [ ] Domínio verificado no Resend
- [ ] RLS ativo e policies configuradas
- [ ] Testes de cadastro funcionando
- [ ] Banner de trial aparecendo
- [ ] Email de boas-vindas sendo enviado
- [ ] Página de upgrade acessível
- [ ] Proteção de trial expirado funcionando

---

## 🔄 Comandos Úteis

```bash
# Ver logs da Edge Function
supabase functions logs send-welcome-email

# Testar Edge Function localmente
supabase functions serve send-welcome-email

# Invocar função manualmente (teste)
supabase functions invoke send-welcome-email --body '{"email":"teste@teste.com","businessName":"Teste Imóveis","ownerName":"João","websiteSlug":"teste","trialEndsAt":"2025-12-16T00:00:00Z"}'
```

---

## ⚠️ Importante

1. **Custos:** Resend tem plano gratuito (100 emails/dia)
2. **Rate Limits:** Configurar rate limiting na API
3. **Backup:** Fazer backup antes de aplicar migrations
4. **Monitoramento:** Configurar alertas para trials expirando

---

## 📞 Suporte

Se algo der errado:
1. Verificar logs do Supabase
2. Verificar logs da Edge Function
3. Verificar console do navegador (F12)
4. Verificar tabela `subscription_communications` no banco
