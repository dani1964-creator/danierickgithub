# 🔍 GUIA DE DIAGNÓSTICO - "Erro ao salvar atualização"

## 🎯 CAUSAS POSSÍVEIS DO ERRO

### 1️⃣ Políticas RLS Incorretas
**Sintoma**: Erro ao fazer INSERT na tabela `app_updates`  
**Causa**: As políticas RLS não permitem o INSERT do usuário autenticado

### 2️⃣ Usuário Não é Super Admin
**Sintoma**: `user.id` existe mas não passa na verificação RLS  
**Causa**: O campo `is_super_admin` do broker está `false`

### 3️⃣ Sessão Expirada
**Sintoma**: `user.id` é `undefined` ou `null`  
**Causa**: Token de autenticação expirou

### 4️⃣ Campo `created_by` Inválido
**Sintoma**: Erro de constraint violation  
**Causa**: `created_by` não é um UUID válido ou não existe em `auth.users`

---

## 🔧 DIAGNÓSTICO PASSO A PASSO

### PASSO 1: Verificar Console do Navegador (F12)

Abra o console do navegador e procure por:

```
❌ Erro ao criar atualização: {message: "...", code: "..."}
```

**Códigos comuns**:
- `42501` = Permissão negada (RLS bloqueou)
- `23503` = Violação de foreign key (created_by inválido)
- `23502` = NOT NULL violation (campo obrigatório faltando)

### PASSO 2: Executar Script de Diagnóstico

No Supabase SQL Editor, execute:

```bash
scripts/CORRIGIR_APP_UPDATES_INSERT.sql
```

Este script vai verificar:
- ✅ Se a tabela existe
- ✅ Estrutura das colunas
- ✅ RLS habilitado
- ✅ Políticas RLS existentes
- ✅ Se você é super admin
- ✅ Aplicar correções automáticas

### PASSO 3: Verificar Logs do Frontend

No componente, procure por logs no console:

```
💾 Salvando atualização... {createdBy: "...", isEdit: false, title: "..."}
```

**Verificar**:
- `createdBy` tem um UUID válido?
- `isEdit` está correto?
- Os campos `title` e `content` não estão vazios?

---

## ✅ SOLUÇÕES POR TIPO DE ERRO

### SOLUÇÃO 1: Corrigir Políticas RLS

Execute o script SQL:

```sql
-- scripts/CORRIGIR_APP_UPDATES_INSERT.sql
```

Este script vai:
1. Remover políticas antigas
2. Criar política para super admin (authenticated role)
3. Criar política para service_role (API routes)
4. Permitir INSERT/UPDATE/DELETE

### SOLUÇÃO 2: Tornar-se Super Admin

Execute no Supabase SQL Editor:

```sql
-- Verificar seu user_id
SELECT auth.uid() AS meu_user_id;

-- Tornar seu broker super admin
UPDATE public.brokers
SET is_super_admin = true
WHERE user_id = auth.uid();

-- Verificar
SELECT business_name, is_super_admin
FROM public.brokers
WHERE user_id = auth.uid();
```

### SOLUÇÃO 3: Renovar Sessão

No navegador:

1. Faça logout em `/admin`
2. Limpe localStorage: `localStorage.clear()`
3. Faça login novamente
4. Tente criar a atualização

### SOLUÇÃO 4: Verificar `created_by`

No console do navegador (F12 > Console), execute:

```javascript
// Ver user.id atual
const { data: { user } } = await supabase.auth.getUser();
console.log('User ID:', user?.id);

// Ver broker associado
const { data: broker } = await supabase
  .from('brokers')
  .select('id, business_name, is_super_admin, user_id')
  .eq('user_id', user?.id)
  .single();
console.log('Broker:', broker);
```

---

## 🧪 TESTE MANUAL NO SQL

Execute no Supabase SQL Editor para testar diretamente:

```sql
-- Teste 1: Verificar permissão
SELECT 
  id,
  business_name,
  is_super_admin,
  user_id
FROM public.brokers
WHERE user_id = auth.uid();

-- Teste 2: Tentar INSERT manual
INSERT INTO app_updates (
  title,
  content,
  update_type,
  is_published,
  created_by
) VALUES (
  'Teste Manual',
  'Testando INSERT direto do SQL',
  'feature',
  false,
  auth.uid()
) RETURNING id, title, created_at;

-- Teste 3: Ver se foi criado
SELECT * FROM app_updates
WHERE created_by = auth.uid()
ORDER BY created_at DESC
LIMIT 1;
```

**Resultado esperado**:
- ✅ INSERT retorna o registro criado
- ❌ Se der erro `42501`, execute SOLUÇÃO 1 (políticas RLS)
- ❌ Se der erro `23503`, execute SOLUÇÃO 2 (super admin)

---

## 📋 CHECKLIST DE VERIFICAÇÃO

Antes de reportar o erro, verifique:

- [ ] Executou `CORRIGIR_APP_UPDATES_INSERT.sql`
- [ ] Verificou que `is_super_admin = true` no seu broker
- [ ] Fez logout e login novamente
- [ ] Console do navegador mostra `createdBy` com UUID válido
- [ ] RLS está habilitado na tabela `app_updates`
- [ ] Políticas RLS incluem role `authenticated`
- [ ] Teste manual no SQL funciona

---

## 🚨 ERROS ESPECÍFICOS E SOLUÇÕES

### Erro: "new row violates row-level security policy"

**Solução**: Execute `CORRIGIR_APP_UPDATES_INSERT.sql`

### Erro: "null value in column 'created_by'"

**Solução**: Faça logout/login, verifique que `user.id` existe

### Erro: "insert or update on table violates foreign key constraint"

**Solução**: O `created_by` não é um UUID válido em `auth.users`

```sql
-- Verificar se seu user existe
SELECT id, email FROM auth.users
WHERE id = auth.uid();
```

### Erro: "permission denied for table app_updates"

**Solução**: RLS está bloqueando. Execute:

```sql
-- Verificar políticas
SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'app_updates';

-- Se vazio, execute CORRIGIR_APP_UPDATES_INSERT.sql
```

---

## 📞 DEBUG AVANÇADO

Se nada funcionar, cole estes resultados:

```sql
-- 1. Suas permissões
SELECT * FROM public.brokers WHERE user_id = auth.uid();

-- 2. Políticas RLS
SELECT policyname, cmd, roles FROM pg_policies WHERE tablename = 'app_updates';

-- 3. Estrutura da tabela
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns
WHERE table_name = 'app_updates';

-- 4. Teste INSERT
INSERT INTO app_updates (title, content, update_type, is_published, created_by)
VALUES ('Debug Test', 'Debug', 'feature', false, auth.uid())
RETURNING *;
```

---

**Última atualização**: 2025-11-16
