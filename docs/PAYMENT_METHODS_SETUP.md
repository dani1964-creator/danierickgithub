# Como Exibir Métodos de Pagamento no Site Público

## ✅ Correções Realizadas

### 1. Correção do Bug de Array (EditPropertyDialog)
- **Problema**: O campo `payment_methods_text` estava sendo tratado como string simples, mas o banco espera array
- **Solução**: Implementada conversão automática:
  - **Ao carregar**: Array convertido para string (cada método em uma linha)
  - **Ao salvar**: String convertida para array (split por linha)

### 2. Migration SQL Criada
- **Arquivo**: `supabase/migrations/20251113000000_add_payment_methods_to_property_detail.sql`
- **Objetivo**: Adicionar campos de métodos de pagamento na função RPC que busca detalhes do imóvel

### 3. Script SQL Pronto para Aplicar
- **Arquivo**: `supabase/sql/APLICAR_PAYMENT_METHODS_PUBLIC.sql`
- **Contém**: SQL completo para copiar e colar no Supabase SQL Editor

## 📋 Como Aplicar a Atualização no Supabase

### Opção 1: Via SQL Editor (Recomendado)

1. Acesse o **Supabase Dashboard**
2. Navegue até **SQL Editor**
3. Clique em **New Query**
4. Abra o arquivo `supabase/sql/APLICAR_PAYMENT_METHODS_PUBLIC.sql`
5. **Copie todo o conteúdo** do arquivo
6. **Cole** no SQL Editor do Supabase
7. Clique em **Run** (ou pressione Ctrl+Enter)
8. Aguarde a confirmação de sucesso

### Opção 2: Via Supabase CLI

```bash
# Se você tem o Supabase CLI instalado localmente
cd /workspaces/danierickgithub
supabase db push
```

## 🎨 Componente de Exibição

O componente `PaymentMethods` já está implementado e será exibido automaticamente quando:

1. O imóvel tiver `payment_methods_type` diferente de `'none'`
2. Para tipo `'text'`: Exibe lista de métodos em cards estilizados
3. Para tipo `'banner'`: Exibe imagem do banner de formas de pagamento

### Localização do Componente
- **Arquivo**: `frontend/components/properties/PaymentMethods.tsx`
- **Usado em**: `frontend/components/properties/PropertyDetailPage.tsx` (linha ~1803)

## 📝 Como Cadastrar Métodos de Pagamento

### No Dashboard de Edição de Imóveis:

1. Abra o imóvel para edição
2. Role até a seção **"Formas de Pagamento"**
3. Selecione o tipo:
   - **Nenhum**: Não exibe nada no site público
   - **Texto**: Digite cada método em uma linha separada
   - **Banner**: Cole a URL de uma imagem

### Exemplo de Métodos em Texto:

```
PIX
Cartão de crédito
Financiamento bancário
Dinheiro
Parcelamento direto com a construtora
```

Cada linha será exibida como um card individual no site público.

## 🧪 Como Testar

### 1. Após Aplicar a Migration:

Execute no SQL Editor para verificar se a função retorna os novos campos:

```sql
SELECT 
  payment_methods_type,
  payment_methods_text,
  payment_methods_banner_url
FROM get_public_property_detail_with_realtor(
  'seu-slug-corretor',  -- Substitua pelo slug real
  'slug-do-imovel'      -- Substitua pelo slug real do imóvel
);
```

### 2. No Frontend:

1. Edite um imóvel e adicione métodos de pagamento
2. Salve o imóvel
3. Acesse a página pública do imóvel
4. Verifique se a seção "Formas de Pagamento" aparece abaixo da descrição

## 📊 Campos Adicionados na Função RPC

A atualização adiciona os seguintes campos no retorno da função `get_public_property_detail_with_realtor`:

```sql
-- Campos de financiamento
financing_enabled boolean,
financing_down_payment_percentage numeric,
financing_max_installments integer,
financing_interest_rate numeric,

-- Campos de badge de oportunidade
show_opportunity_badge boolean,
opportunity_badge_text text,

-- Campos de métodos de pagamento
payment_methods_type text,
payment_methods_text text[],
payment_methods_banner_url text
```

## ⚠️ Importante

- **Não é necessário reimplantar o frontend** - o componente já está implementado
- **Apenas aplique a migration SQL** no Supabase
- Após aplicar, as informações aparecerão automaticamente no site público

## 🔍 Verificação de Tipo TypeScript

A interface TypeScript já está correta em:
- `frontend/components/properties/PropertyDetailPage.tsx`
- `frontend/integrations/supabase/types.ts`

Todos os tipos estão sincronizados com o banco de dados.
