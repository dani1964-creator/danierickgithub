# 🎯 Melhorias de SEO para URLs de Imóveis

## ✨ O que foi implementado

### 1. **URLs Amigáveis (SEO-Friendly)**

#### Antes:
```
❌ https://danierick.adminimobiliaria.site/651438be-46db-4347-a3b4-508820abc1a0
```

#### Depois:
```
✅ https://danierick.adminimobiliaria.site/apartamento-3-quartos-centro-curitiba-651438be
```

### 2. **Geração Automática de Slugs**

O sistema agora gera automaticamente slugs SEO-friendly quando um imóvel é criado:

- **Formato**: `{titulo-normalizado}-{id-curto}`
- **Exemplo**: `casa-luxo-batel-651438be`
- **Normalização**: Remove acentos, caracteres especiais, substitui espaços por hífens

### 3. **Dados Estruturados (Schema.org)**

Adicionado JSON-LD completo para melhorar SEO e rich snippets:

- ✅ **RealEstateListing** - Identificação específica para imóveis
- ✅ **Endereço completo** - Rua, bairro, UF, país
- ✅ **Características** - Quartos, banheiros, área, vagas
- ✅ **Oferta** - Preço, moeda, disponibilidade
- ✅ **Imobiliária** - Nome, logo, telefone, email
- ✅ **Breadcrumbs** - Navegação estruturada
- ✅ **Múltiplas imagens** - Todas as fotos do imóvel

### 4. **Meta Tags Otimizadas**

- **Title**: Personalizado por imóvel
- **Description**: Inclui preço, características e localização
- **Open Graph**: Compartilhamento otimizado para WhatsApp/Facebook/Twitter
- **Twitter Cards**: Preview rico em redes sociais
- **Canonical URL**: Evita conteúdo duplicado

## 📋 Como usar

### Para Novos Imóveis

Os slugs são gerados **automaticamente** quando você cria um novo imóvel. Não é necessário fazer nada!

### Para Imóveis Existentes

Execute o script de migração para gerar slugs nos imóveis que ainda não têm:

```bash
# Opção 1: Via SQL (mais rápido)
# Execute a migration no Supabase SQL Editor:
cat supabase/migrations/20251111000000_generate_missing_property_slugs.sql

# Opção 2: Via Script Node.js
cd scripts
node generate-property-slugs.mjs
```

## 🔍 Validação de SEO

Depois de aplicar as mudanças, valide com estas ferramentas:

1. **Google Rich Results Test**
   - URL: https://search.google.com/test/rich-results
   - Cole a URL do imóvel para verificar os dados estruturados

2. **Facebook Sharing Debugger**
   - URL: https://developers.facebook.com/tools/debug/
   - Valide como o imóvel aparece ao compartilhar

3. **Twitter Card Validator**
   - URL: https://cards-dev.twitter.com/validator
   - Verifique o preview no Twitter

4. **WhatsApp Preview**
   - Compartilhe a URL em um chat do WhatsApp
   - Verifique se imagem, título e descrição aparecem corretamente

## 📊 Benefícios de SEO

### Para o Google
- ✅ Indexação mais rápida
- ✅ Rich snippets (estrelas, preço, localização)
- ✅ Melhor posicionamento em buscas locais
- ✅ URLs descritivas nos resultados

### Para Redes Sociais
- ✅ Previews ricos ao compartilhar
- ✅ Imagens de alta qualidade
- ✅ Informações completas (preço, quartos, etc)
- ✅ CTA claro (Ver Imóvel)

### Para Usuários
- ✅ URLs fáceis de ler e memorizar
- ✅ Links descritivos
- ✅ Confiança aumentada
- ✅ Melhor experiência de navegação

## 🛠️ Configuração Técnica

### Estrutura do Slug

```javascript
// Função de geração (em PostgreSQL e JavaScript)
function generateSlug(title) {
  return title
    .toLowerCase()                    // minúsculas
    .normalize('NFD')                 // remove acentos
    .replace(/[\u0300-\u036f]/g, '') // remove diacríticos
    .replace(/[^a-z0-9\s\-]/g, '')   // remove especiais
    .replace(/\s+/g, '-')             // espaços → hífens
    .replace(/-+/g, '-')              // remove duplicados
    .trim();
}

// Resultado final
const slug = `${generateSlug(title)}-${id.substring(0, 8)}`;
```

### Trigger no Banco

```sql
-- Automático no INSERT/UPDATE
CREATE TRIGGER set_property_slug_trigger
  BEFORE INSERT OR UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.set_property_slug();
```

## 📝 Exemplos de Slugs Gerados

| Título do Imóvel | Slug Gerado |
|------------------|-------------|
| "Apartamento 3 Quartos no Centro" | `apartamento-3-quartos-no-centro-651438be` |
| "Casa de Luxo em Batel - Curitiba" | `casa-de-luxo-em-batel-curitiba-a1b2c3d4` |
| "Cobertura Duplex Água Verde" | `cobertura-duplex-agua-verde-9f8e7d6c` |
| "Sala Comercial - Ed. Platinum" | `sala-comercial-ed-platinum-5b4a3c2d` |

## 🚀 Deploy

As mudanças já estão aplicadas no código. Para ativar em produção:

1. Faça deploy do frontend (Next.js)
2. Execute a migration SQL no Supabase
3. (Opcional) Rode o script de geração para imóveis antigos
4. Valide URLs no ambiente de produção

## ⚠️ Notas Importantes

- **Slugs são únicos**: O ID curto garante unicidade mesmo com títulos iguais
- **Compatibilidade**: URLs antigas (com ID puro) continuam funcionando
- **Fallback**: Se não houver slug, o sistema usa o ID automaticamente
- **Permanência**: Slugs não mudam automaticamente se você editar o título

## 🔗 Links Úteis

- [Schema.org RealEstateListing](https://schema.org/RealEstateListing)
- [Google Search Central - Structured Data](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data)
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Cards](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)

---

**Desenvolvido com ❤️ para otimizar seu site de imóveis**
