# 📋 GUIA DE EXECUÇÃO - SCRIPTS SUPABASE

## 🎯 ORDEM DE EXECUÇÃO DOS SCRIPTS

Execute os scripts **nesta ordem exata** no Supabase SQL Editor:

### 1️⃣ DIAGNÓSTICO E CORREÇÃO DO CADASTRO
**Arquivo**: `DIAGNOSTICO_E_CORRECAO_CADASTRO.sql`

**O que faz**:
- ✅ Diagnostica se as funções e triggers existem
- ✅ Recria função `initialize_subscription_trial`
- ✅ Recria trigger `sync_trial_ends_at_trigger`
- ✅ Configura políticas RLS corretas para permitir cadastro
- ✅ Verifica se tudo está OK

**Quando executar**: PRIMEIRO (essencial para cadastro funcionar)

---

### 2️⃣ STORAGE E COMUNICAÇÕES PRIVADAS
**Arquivo**: `APLICAR_STORAGE_PRIVADO_COMPLETO.sql`

**O que faz**:
- ✅ Cria bucket `attachments` PRIVADO (não público)
- ✅ Configura políticas RLS para arquivos (admin vê tudo, brokers só seus)
- ✅ Adiciona coluna `attachment_url` em `subscription_communications`
- ✅ Configura políticas RLS para mensagens (privacidade garantida)

**Quando executar**: SEGUNDO (após corrigir cadastro)

---

### 3️⃣ TRIGGER DE TRIAL (SE NECESSÁRIO)
**Arquivo**: `fix-missing-trigger.sql`

**O que faz**:
- ✅ Garante que o trigger de sincronização existe
- ✅ Sincroniza registros existentes

**Quando executar**: TERCEIRO (apenas se o script 1 não resolver)

---

## 🔍 VERIFICAÇÃO PÓS-EXECUÇÃO

Após executar os scripts, rode estas queries para confirmar:

```sql
-- 1. Verificar função
SELECT routine_name FROM information_schema.routines 
WHERE routine_name = 'initialize_subscription_trial';
-- Deve retornar: 1 linha

-- 2. Verificar trigger
SELECT trigger_name FROM information_schema.triggers 
WHERE trigger_name = 'sync_trial_ends_at_trigger';
-- Deve retornar: 1 linha

-- 3. Verificar bucket
SELECT id, name, public FROM storage.buckets WHERE id = 'attachments';
-- Deve retornar: 1 linha com public = false

-- 4. Verificar coluna
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'subscription_communications' 
  AND column_name = 'attachment_url';
-- Deve retornar: 1 linha
```

---

## ✅ RESULTADOS ESPERADOS

Após executar todos os scripts:

### Cadastro de Imobiliária
- ✅ Formulário em `/cadastro` funciona sem erros
- ✅ Cria usuário no Supabase Auth
- ✅ Cria broker com dados completos
- ✅ Cria assinatura trial de 30 dias
- ✅ Sincroniza `trial_ends_at` automaticamente

### Sistema de Anexos
- ✅ Imobiliária pode fazer upload de comprovantes
- ✅ Arquivos são PRIVADOS
- ✅ Admin vê TODOS os anexos na aba Tickets
- ✅ Imobiliária NÃO vê histórico completo (apenas confirmação de envio)

### Comunicações
- ✅ Mensagens salvas em `subscription_communications`
- ✅ URL do anexo salva em `attachment_url`
- ✅ RLS garante privacidade (brokers só veem suas mensagens)
- ✅ Admin vê todas as mensagens na aba Tickets

---

## 🚨 PROBLEMAS COMUNS

### "Erro ao criar imobiliária"
**Solução**: Execute `DIAGNOSTICO_E_CORRECAO_CADASTRO.sql`

### "Bucket already exists"
**Solução**: Normal, o script usa `ON CONFLICT` para atualizar

### "Policy already exists"
**Solução**: Normal, o script usa `DROP POLICY IF EXISTS`

---

## 📞 SUPORTE

Se após executar os scripts ainda houver erros:

1. Execute as queries de verificação acima
2. Copie os resultados
3. Verifique os logs do console do browser (F12)
4. Verifique os logs da API em `/api/auth/register-trial`

---

**Última atualização**: 2025-11-16
