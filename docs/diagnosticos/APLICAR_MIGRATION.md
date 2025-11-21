# 🚀 Aplicar Migration de Métodos de Pagamento

## 3 Formas de Aplicar (escolha uma):

### ✅ Opção 1: Via Supabase Dashboard (Mais Simples)

1. **Acesse o Supabase Dashboard**
   - Entre em https://supabase.com/dashboard
   - Selecione seu projeto

2. **Abra o SQL Editor**
   - Menu lateral → SQL Editor
   - Clique em "New Query"

3. **Cole e Execute**
   - Abra o arquivo: `supabase/sql/APLICAR_PAYMENT_METHODS_PUBLIC.sql`
   - Copie **todo** o conteúdo
   - Cole no editor
   - Clique em **RUN** (ou Ctrl+Enter)

4. **Pronto!** ✅
   - Você verá "Success" se tudo funcionou

---

### 🖥️ Opção 2: Via Script Node.js

Se você tem as credenciais do Supabase configuradas:

```bash
# Configure as variáveis (se ainda não tiver)
export SUPABASE_URL="https://seu-projeto.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="sua-service-role-key"

# Execute o script
node scripts/apply-payment-methods.js
```

---

### 🐚 Opção 3: Via Script Bash

```bash
# Configure as variáveis (se ainda não tiver)
export SUPABASE_URL="https://seu-projeto.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="sua-service-role-key"

# Execute o script
./scripts/apply-payment-methods-migration.sh
```

---

## 📍 Onde Encontrar as Credenciais do Supabase

1. Acesse o **Supabase Dashboard**
2. Vá em **Project Settings** (ícone de engrenagem)
3. Clique em **API**
4. Você verá:
   - **URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: Chave pública (para frontend)
   - **service_role key**: Chave privada (para backend/scripts)

⚠️ **Importante**: Use a `service_role` key apenas em ambiente seguro (backend/scripts), nunca no frontend!

---

## 🧪 Como Verificar se Funcionou

Após aplicar a migration, teste no SQL Editor do Supabase:

```sql
-- Substitua pelos valores reais do seu sistema
SELECT 
  payment_methods_type,
  payment_methods_text,
  payment_methods_banner_url
FROM get_public_property_detail_with_realtor(
  'danierick',           -- slug do corretor
  'casa-exemplo-abc123'  -- slug do imóvel
);
```

Se retornar os campos (mesmo que NULL), a migration foi aplicada com sucesso!

---

## ❓ Problemas?

### "Credenciais não configuradas"
- Certifique-se de que as variáveis de ambiente estão corretas
- Verifique se não há espaços extras nas chaves

### "Arquivo SQL não encontrado"
- Execute o script a partir da raiz do projeto: `/workspaces/danierickgithub/`

### "Erro de permissão"
- Use a `service_role` key, não a `anon` key
- A `service_role` key tem permissões de admin

### Ainda com problemas?
Use a **Opção 1** (Supabase Dashboard) - é a mais confiável e visual.

---

## 📖 Documentação Completa

Veja mais detalhes em: `docs/PAYMENT_METHODS_SETUP.md`
