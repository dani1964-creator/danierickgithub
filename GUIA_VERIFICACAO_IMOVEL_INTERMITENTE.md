# 🔍 GUIA DE VERIFICAÇÃO E CORREÇÃO
## Problema: Imóveis Aparecendo e Sumindo Intermitentemente

**Data:** 21 de Novembro de 2025  
**Erro Relacionado:** `Cannot read properties of undefined (reading 'property_type')`

---

## 📋 ÍNDICE

1. [Diagnóstico do Problema](#diagnóstico)
2. [Como Executar a Verificação](#execução)
3. [Interpretação dos Resultados](#interpretação)
4. [Aplicação das Correções](#correções)
5. [Verificação Final](#verificação-final)

---

## 🎯 DIAGNÓSTICO DO PROBLEMA

### Sintomas Identificados:
- ✅ Página de detalhes de imóveis aparece e some intermitentemente
- ✅ Erro: `Cannot read properties of undefined (reading 'property_type')`
- ✅ Site público com comportamento inconsistente

### Causas Prováveis:
1. **Campos NULL críticos** na tabela `properties` (`property_type`, `slug`, `is_published`)
2. **RPC `get_property_by_slug` retornando dados inconsistentes**
3. **Políticas RLS (Row Level Security) bloqueando acesso público**
4. **Brokers inativos ou sem slugs configurados**
5. **Duplicação de slugs** causando conflitos
6. **Frontend não tratando valores NULL/undefined**

---

## 🚀 COMO EXECUTAR A VERIFICAÇÃO

### Passo 1: Acessar o Supabase Dashboard

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **SQL Editor** no menu lateral

### Passo 2: Executar o Diagnóstico Completo

1. Abra o arquivo: **`DIAGNOSTICO_IMOVEL_INTERMITENTE.sql`**
2. Copie **TODO o conteúdo** do arquivo
3. Cole no SQL Editor do Supabase
4. **NÃO execute tudo de uma vez!** Execute seção por seção:

```sql
-- Execute cada parte separadamente e analise os resultados:

-- PARTE 1: Estrutura da tabela
-- PARTE 2: Auditoria de dados
-- PARTE 3: Verificação da RPC
-- PARTE 4: Teste da RPC
-- PARTE 5: Políticas RLS
-- PARTE 6: Verificação de brokers
-- PARTE 7: Duplicatas
-- PARTE 8: Timestamps
-- PARTE 9: Imagens
-- PARTE 10: Resumo
```

### Passo 3: Documentar os Resultados

Anote os resultados de cada seção, especialmente:
- Quantos registros com `property_type NULL`?
- Quantos registros com `slug NULL`?
- Quantos registros com `is_published = false`?
- A RPC está retornando dados?
- Existem slugs duplicados?

---

## 📊 INTERPRETAÇÃO DOS RESULTADOS

### 🔴 PROBLEMAS CRÍTICOS (Exigem correção imediata)

| Problema | Descrição | Impacto |
|----------|-----------|---------|
| `property_type NULL` | Imóveis sem tipo definido | ❌ Página quebra com erro |
| `slug NULL` | Imóveis sem URL amigável | ❌ Não podem ser acessados |
| `is_published NULL/false` | Imóveis não publicados | ⚠️ Não aparecem no site |
| `is_active = false` | Imóveis desativados | ⚠️ Não aparecem no site |
| Broker inativo | Corretor desativado | ❌ Todos os imóveis dele somem |
| Slugs duplicados | Mesmo slug para múltiplos imóveis | ❌ Conflito de rotas |

### 🟡 PROBLEMAS MÉDIOS (Devem ser corrigidos)

| Problema | Descrição | Impacto |
|----------|-----------|---------|
| RPC sem COALESCE | Campos NULL não tratados | ⚠️ Frontend recebe undefined |
| Sem índices | Queries lentas | ⚠️ Lentidão no carregamento |
| RLS muito restritivo | Bloqueando acesso público | ❌ Nada aparece no site |

### 🟢 PROBLEMAS MENORES (Opcional corrigir)

| Problema | Descrição | Impacto |
|----------|-----------|---------|
| Imagens vazias | Array vazio de imagens | ℹ️ Visual sem foto |
| Views count NULL | Contador de visualizações zerado | ℹ️ Estatística perdida |

---

## 🛠️ APLICAÇÃO DAS CORREÇÕES

### ⚠️ IMPORTANTE: Backup Primeiro!

Antes de executar qualquer correção, faça backup:

```sql
-- 1. Backup da tabela properties
CREATE TABLE properties_backup_20251121 AS 
SELECT * FROM properties;

-- 2. Backup da tabela brokers
CREATE TABLE brokers_backup_20251121 AS 
SELECT * FROM brokers;
```

### Passo 1: Executar Script de Correção

1. Abra o arquivo: **`CORRECAO_IMOVEL_INTERMITENTE.sql`**
2. Leia os comentários de cada seção
3. Execute **seção por seção** (não tudo de uma vez!)
4. Verifique os resultados entre cada seção

### Ordem de Execução Recomendada:

```
✅ PASSO 1: Garantir colunas existem
✅ PASSO 2: Corrigir valores NULL
✅ PASSO 3: Criar/substituir RPC robusta
✅ PASSO 4: Ajustar políticas RLS
✅ PASSO 5: Criar índices
✅ PASSO 6: Adicionar constraints
✅ PASSO 7: Função auxiliar de views
✅ PASSO 8: Verificação final
✅ PASSO 9: Tabela de log
```

### Exemplo de Execução Segura:

```sql
-- Executar PASSO 2.1
UPDATE properties
SET property_type = 'apartment'
WHERE property_type IS NULL;

-- ✅ Verificar quantos foram afetados
SELECT COUNT(*) FROM properties WHERE property_type = 'apartment';

-- ✅ Se estiver correto, continuar para o próximo passo
```

---

## 🧪 VERIFICAÇÃO FINAL

### Teste 1: Verificar RPC Manualmente

```sql
-- 1. Buscar um imóvel ativo
SELECT 
    p.slug as property_slug,
    b.website_slug as broker_slug,
    p.title
FROM properties p
JOIN brokers b ON p.broker_id = b.id
WHERE p.is_active = true 
  AND p.slug IS NOT NULL
LIMIT 1;

-- 2. Testar a RPC com os dados acima
SELECT * FROM get_property_by_slug(
    'imovel-slug-aqui',  -- substitua
    'broker-slug-aqui',  -- substitua
    NULL
);

-- ✅ Deve retornar 1 linha com property_data e broker_data
-- ❌ Se retornar vazio, há problema na RPC ou políticas RLS
```

### Teste 2: Verificar Estatísticas

```sql
SELECT 
    COUNT(*) as total_imoveis,
    COUNT(*) FILTER (WHERE is_active = true AND is_published = true) as visiveis,
    COUNT(*) FILTER (WHERE property_type IS NULL) as sem_tipo,
    COUNT(*) FILTER (WHERE slug IS NULL) as sem_slug
FROM properties;
```

**Resultados Esperados:**
- ✅ `sem_tipo = 0`
- ✅ `sem_slug = 0`
- ✅ `visiveis > 0`

### Teste 3: Testar no Site

1. Abra o site público do broker: `https://seu-dominio.com/imoveis/imovel-slug`
2. Recarregue a página 5-10 vezes (Ctrl+F5)
3. A página deve aparecer **consistentemente** sem sumir

**Se o problema persistir:**
- ✅ Execute novamente a PARTE 5 do diagnóstico (Políticas RLS)
- ✅ Verifique os logs do navegador (F12 → Console)
- ✅ Verifique os logs do Supabase (Dashboard → Logs → Functions)

---

## 🔧 CORREÇÕES ADICIONAIS NO FRONTEND

Após corrigir o backend, aplique estas correções no frontend:

### Arquivo: `frontend/src/pages/PropertyDetailPage.tsx`

**Problema na linha 282-285:**
```typescript
// ❌ ANTES (sem validação)
const propertyData = propertyResult.property_data;
const brokerData = propertyResult.broker_data;
```

**Solução:**
```typescript
// ✅ DEPOIS (com validação)
const propertyData = propertyResult?.property_data;
const brokerData = propertyResult?.broker_data;

// Validar se os dados existem
if (!propertyData || !brokerData) {
  console.error('Dados da propriedade ou broker estão ausentes', {
    propertyResult,
    effectivePropertySlug,
    effectiveSlug,
    customDomain
  });
  setError('Imóvel não encontrado');
  setLoading(false);
  return;
}

// Validar campos críticos
if (!propertyData.property_type) {
  console.warn('property_type está ausente, usando fallback', propertyData);
  propertyData.property_type = 'apartment'; // fallback
}
```

**Problema na linha 298:**
```typescript
// ❌ ANTES
.eq('property_type', propertyData.property_type)
```

**Solução:**
```typescript
// ✅ DEPOIS
.eq('property_type', propertyData.property_type || 'apartment')
```

**Problema na linha 356:**
```typescript
// ❌ ANTES
type: propertyData.property_type,
```

**Solução:**
```typescript
// ✅ DEPOIS
type: propertyData.property_type || 'unknown',
```

**Problema na linha 1715:**
```typescript
// ❌ ANTES
{property.property_type}
```

**Solução:**
```typescript
// ✅ DEPOIS
{property.property_type || 'Tipo não informado'}
```

---

## 📞 CHECKLIST FINAL

### ✅ Backend (Supabase)
- [ ] Executei DIAGNOSTICO_IMOVEL_INTERMITENTE.sql completo
- [ ] Documentei todos os problemas encontrados
- [ ] Executei CORRECAO_IMOVEL_INTERMITENTE.sql seção por seção
- [ ] Verifiquei que todos os `property_type` estão preenchidos
- [ ] Verifiquei que todos os `slug` estão preenchidos
- [ ] Testei a RPC manualmente e ela retorna dados
- [ ] Não existem slugs duplicados
- [ ] Políticas RLS permitem acesso público

### ✅ Frontend (React)
- [ ] Adicionei validações após extrair `propertyData`
- [ ] Adicionei fallback para `property_type` em todas as linhas
- [ ] Adicionei safe navigation (optional chaining)
- [ ] Adicionei logs de debug no console
- [ ] Testei recarregar a página múltiplas vezes
- [ ] A página não some mais intermitentemente

### ✅ Teste Final
- [ ] Site carrega consistentemente
- [ ] Nenhum erro no console do navegador
- [ ] Nenhum erro no log do Supabase
- [ ] Imóveis aparecem na listagem
- [ ] Página de detalhes abre corretamente
- [ ] Contador de visualizações funciona
- [ ] Botões de compartilhamento funcionam

---

## 🆘 PROBLEMAS COMUNS

### Problema: "A RPC não retorna nada"

**Possíveis Causas:**
1. Broker está inativo (`is_active = false`)
2. Imóvel está com `is_published = false`
3. Slug incorreto na URL
4. Políticas RLS bloqueando acesso

**Solução:**
```sql
-- Verificar status do broker
SELECT id, business_name, website_slug, is_active 
FROM brokers 
WHERE website_slug = 'seu-slug-aqui';

-- Ativar broker se necessário
UPDATE brokers 
SET is_active = true 
WHERE website_slug = 'seu-slug-aqui';

-- Verificar status do imóvel
SELECT id, title, slug, is_active, is_published, broker_id
FROM properties
WHERE slug = 'imovel-slug-aqui';

-- Publicar imóvel se necessário
UPDATE properties
SET is_active = true, is_published = true
WHERE slug = 'imovel-slug-aqui';
```

### Problema: "Erro de permissão ao executar RPC"

**Solução:**
```sql
-- Garantir permissões
GRANT EXECUTE ON FUNCTION get_property_by_slug(TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_property_by_slug(TEXT, TEXT, TEXT) TO authenticated;
```

### Problema: "Frontend continua quebrando"

**Verificar no Console do Navegador (F12):**
- Qual é o erro exato?
- Em qual linha do código está quebrando?
- O que a RPC está retornando (verificar aba Network)

**Adicionar Debug Temporário:**
```typescript
console.log('1. Chamando RPC com:', {
  effectivePropertySlug,
  effectiveSlug,
  customDomain
});

const { data: propertyResult, error: propertyError } = await (supabase as any)
  .rpc('get_property_by_slug', {
    p_property_slug: effectivePropertySlug,
    p_broker_slug: effectiveSlug,
    p_custom_domain: customDomain
  })
  .single();

console.log('2. Resultado da RPC:', propertyResult);
console.log('3. Erro da RPC:', propertyError);
console.log('4. propertyData:', propertyResult?.property_data);
```

---

## 📚 ARQUIVOS DE REFERÊNCIA

- **Diagnóstico:** `DIAGNOSTICO_IMOVEL_INTERMITENTE.sql`
- **Correção Backend:** `CORRECAO_IMOVEL_INTERMITENTE.sql`
- **Este Guia:** `GUIA_VERIFICACAO_IMOVEL_INTERMITENTE.md`
- **Frontend Principal:** `frontend/src/pages/PropertyDetailPage.tsx`

---

## ✅ SUCESSO!

Após seguir todos os passos:
- ✅ O erro `Cannot read properties of undefined (reading 'property_type')` deve estar resolvido
- ✅ Os imóveis devem aparecer consistentemente no site público
- ✅ A página de detalhes não deve mais sumir intermitentemente

**Se ainda houver problemas, verifique:**
1. Logs do Supabase (Dashboard → Logs)
2. Console do navegador (F12)
3. Network requests (F12 → Network → Filter: supabase)

---

**Última atualização:** 21/11/2025  
**Versão:** 1.0
