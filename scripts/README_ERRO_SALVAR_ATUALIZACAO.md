# 🔴 ERRO: "Erro ao salvar atualização"

## 🎯 SOLUÇÃO RÁPIDA (3 PASSOS)

### 1️⃣ Abrir Console do Navegador
Pressione **F12** e vá na aba **Console**. Procure pela mensagem de erro:

```
❌ Erro ao criar atualização: {...}
```

Copie o código do erro (`code: "42501"`, `code: "23503"`, etc.)

---

### 2️⃣ Executar Script de Correção
No **Supabase SQL Editor**, copie e execute este arquivo:

```
scripts/CORRIGIR_APP_UPDATES_INSERT.sql
```

Este script vai:
- ✅ Diagnosticar o problema
- ✅ Corrigir políticas RLS automaticamente
- ✅ Permitir INSERT/UPDATE/DELETE para super admin
- ✅ Verificar se você é super admin

---

### 3️⃣ Testar Novamente
1. Faça **logout** em `/admin`
2. Faça **login** novamente
3. Tente criar a atualização novamente
4. Deve funcionar! ✅

---

## 📚 DOCUMENTAÇÃO COMPLETA

Se a solução rápida não funcionar, consulte:

📄 **`GUIA_RESOLVER_ERRO_APP_UPDATES.md`**
- Diagnóstico detalhado
- 4 causas possíveis do erro
- Soluções específicas por tipo de erro
- Testes manuais no SQL
- Checklist completo

---

## 🚨 CAUSAS COMUNS

| Código | Erro | Solução |
|--------|------|---------|
| `42501` | Permissão negada (RLS) | Execute `CORRIGIR_APP_UPDATES_INSERT.sql` |
| `23503` | Foreign key violation | Verifique se você é super admin |
| `23502` | NULL constraint | Faça logout/login novamente |
| Outro | Erro desconhecido | Veja `GUIA_RESOLVER_ERRO_APP_UPDATES.md` |

---

## ⚡ TESTE RÁPIDO NO SQL

Cole no **Supabase SQL Editor**:

```sql
-- Ver se você é super admin
SELECT business_name, is_super_admin
FROM public.brokers
WHERE user_id = auth.uid();

-- Deve retornar: is_super_admin = true
```

Se retornar `false`, execute:

```sql
UPDATE public.brokers
SET is_super_admin = true
WHERE user_id = auth.uid();
```

---

## 📁 ARQUIVOS DISPONÍVEIS

1. **README_ERRO_SALVAR_ATUALIZACAO.md** (este arquivo)
   - Solução rápida em 3 passos

2. **CORRIGIR_APP_UPDATES_INSERT.sql** (script principal)
   - Diagnóstico + correção automática
   - Execute no Supabase SQL Editor

3. **GUIA_RESOLVER_ERRO_APP_UPDATES.md** (guia completo)
   - Diagnóstico detalhado
   - 4 soluções específicas
   - Debug avançado

---

**Status**: ✅ Pronto para usar  
**Última atualização**: 2025-11-16
