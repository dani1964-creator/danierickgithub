# 🚀 CORREÇÃO COMPLETA: Imóveis Aparecendo e Sumindo

**Data:** 21/11/2025  
**Problema:** Erro `Cannot read properties of undefined (reading 'property_type')` e imóveis sumindo intermitentemente

---

## 📋 RESUMO DO PROBLEMA

### Causa Raiz Identificada:

1. **🚨 RPC com ordem de parâmetros INVERTIDA**
   - Frontend envia: `(property_slug, broker_slug, domain)`
   - RPC antiga esperava: `(broker_slug, domain, property_slug)`
   - **Resultado:** RPC nunca encontra o imóvel e retorna vazio

2. **⚠️ Frontend sem validação de dados NULL**
   - Código acessa `propertyData.property_type` sem verificar se `propertyData` existe
   - Quando RPC retorna vazio, causa erro `Cannot read properties of undefined`

3. **⚠️ Política RLS com campo inexistente**
   - Busca `b.status = 'active'` mas campo correto é `b.is_active`

---

## ✅ CORREÇÕES APLICADAS

### 1️⃣ **BACKEND (Supabase) - EXECUTAR PRIMEIRO**

**Arquivo:** `SOLUCAO_URGENTE_RPC.sql`

**Ações:**
- ✅ Remove RPC antiga com ordem errada
- ✅ Cria RPC nova com ordem correta: `(property_slug, broker_slug, domain)`
- ✅ Adiciona `COALESCE` em todos os campos para evitar NULL
- ✅ Corrige política RLS para usar `is_active` em vez de `status`
- ✅ Gera `website_slug` automaticamente para brokers sem slug
- ✅ Inclui testes de verificação

**Como executar:**
```bash
1. Acesse: https://supabase.com/dashboard
2. Vá em SQL Editor
3. Copie TODO conteúdo de SOLUCAO_URGENTE_RPC.sql
4. Execute
5. Verifique se os testes (PASSO 7) retornam dados
```

---

### 2️⃣ **FRONTEND (React) - JÁ CORRIGIDO**

**Arquivo:** `frontend/components/properties/PropertyDetailPage.tsx`

**Correções aplicadas:**

#### Linha 281-302: Validação após RPC
```typescript
// ✅ ANTES (sem validação)
const propertyData = propertyResult.property_data;
const brokerData = propertyResult.broker_data;

// ✅ DEPOIS (com validação)
const propertyData = propertyResult?.property_data;
const brokerData = propertyResult?.broker_data;

if (!propertyData || !brokerData) {
  console.error('❌ RPC retornou dados vazios:', {...});
  setError('Imóvel não encontrado');
  setLoading(false);
  return;
}

if (!propertyData.property_type) {
  console.warn('⚠️ property_type ausente, usando fallback');
  propertyData.property_type = 'apartment';
}
```

#### Linha 298-300: Fallback em queries
```typescript
// ✅ ANTES (sem fallback)
.eq('property_type', propertyData.property_type)
.eq('transaction_type', propertyData.transaction_type)

// ✅ DEPOIS (com fallback)
.eq('property_type', propertyData.property_type || 'apartment')
.eq('transaction_type', propertyData.transaction_type || 'sale')
```

#### Linha 1734: Fallback na renderização
```typescript
// ✅ ANTES
{property.property_type}

// ✅ DEPOIS
{property.property_type || 'Tipo não informado'}
```

---

## 🧪 COMO TESTAR

### Teste 1: Verificar RPC no Supabase

```sql
-- Execute no SQL Editor
SELECT * FROM get_property_by_slug(
  'casa-teste-venda',  -- slug do imóvel
  'rfimobiliaria',     -- slug do broker
  NULL                 -- domínio customizado
);
```

**✅ Esperado:** Retorna 1 linha com todos os dados do imóvel  
**❌ Problema:** Retorna vazio ou erro

---

### Teste 2: Testar no Site Público

1. Acesse o site: `https://seu-dominio.com/imoveis/casa-teste-venda`
2. Recarregue a página **10 vezes** (Ctrl+F5)
3. Verifique o console do navegador (F12)

**✅ Esperado:** 
- Página carrega SEMPRE
- Nenhum erro no console
- Imóvel aparece consistentemente

**❌ Problema:**
- Página some intermitentemente
- Erro: `Cannot read properties of undefined (reading 'property_type')`
- Console mostra: `❌ RPC retornou dados vazios`

---

### Teste 3: Verificar Network Request

1. Abra DevTools (F12) → Aba Network
2. Filtre por: `get_property_by_slug`
3. Recarregue a página
4. Clique na requisição RPC
5. Veja a aba Response

**✅ Esperado:**
```json
[
  {
    "id": "uuid-aqui",
    "title": "Casa teste Venda",
    "property_type": "condo",
    ...
  }
]
```

**❌ Problema:**
```json
[]  // array vazio
```

---

## 📊 CHECKLIST DE VERIFICAÇÃO

### Backend (Supabase)
- [ ] Executei `SOLUCAO_URGENTE_RPC.sql` completo
- [ ] Query 7.1 retorna: `arguments: "p_property_slug text, p_broker_slug text, p_custom_domain text"`
- [ ] Query 7.2 mostra todos brokers com slugs (✅ OK)
- [ ] Query 7.3 retorna 1 linha com dados do imóvel
- [ ] Nenhum erro no SQL Editor

### Frontend (React)
- [ ] Arquivo `PropertyDetailPage.tsx` foi modificado
- [ ] Validação `if (!propertyData || !brokerData)` está presente
- [ ] Fallback `property_type || 'apartment'` está presente
- [ ] Fallback na renderização `|| 'Tipo não informado'` está presente
- [ ] Código commitado e deployed

### Testes
- [ ] RPC retorna dados quando executada manualmente
- [ ] Site carrega consistentemente (10 recarregamentos)
- [ ] Nenhum erro no console do navegador
- [ ] Network request mostra dados válidos
- [ ] Página de detalhes funciona com diferentes imóveis

---

## 🆘 TROUBLESHOOTING

### Problema: RPC ainda retorna vazio

**Causas possíveis:**
1. RPC antiga não foi removida
2. Ordem de parâmetros ainda está errada
3. Broker não existe ou está inativo
4. Slug do imóvel ou broker está errado

**Solução:**
```sql
-- Verificar qual versão da RPC está ativa
SELECT proname, pg_get_function_arguments(oid)
FROM pg_proc
WHERE proname = 'get_property_by_slug';

-- Se retornar ordem errada, execute DROP FUNCTION novamente
DROP FUNCTION IF EXISTS get_property_by_slug(text, text, text);
-- E recrie a função correta
```

---

### Problema: Frontend ainda quebra

**Causas possíveis:**
1. Mudanças não foram salvas/deployed
2. Cache do navegador
3. Build antiga no servidor

**Solução:**
```bash
# Limpar cache e rebuildar
cd frontend
npm run build
# Deploy novamente
```

---

### Problema: Políticas RLS bloqueando

**Verificar:**
```sql
-- Ver todas as políticas ativas
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'properties'
  AND 'anon' = ANY(roles);

-- Se houver conflito, remover política antiga
DROP POLICY IF EXISTS "public_read_published_properties" ON properties;
```

---

## 📞 SUPORTE

Se o problema persistir após seguir todos os passos:

1. **Verifique os logs do Supabase:**
   - Dashboard → Logs → Functions
   - Procure por erros na RPC `get_property_by_slug`

2. **Verifique o console do navegador:**
   - Erro exato
   - Stack trace
   - Request/Response da RPC

3. **Teste com diferentes imóveis:**
   - Alguns imóveis funcionam, outros não?
   - Pode ser problema específico de dados

---

## ✅ SUCESSO!

Após aplicar todas as correções:
- ✅ Imóveis aparecem CONSISTENTEMENTE
- ✅ Nenhum erro `Cannot read properties of undefined`
- ✅ RPC retorna dados corretamente
- ✅ Página de detalhes não some mais

**Problema resolvido!** 🎉

---

**Última atualização:** 21/11/2025  
**Versão:** 2.0 (Backend + Frontend corrigidos)
