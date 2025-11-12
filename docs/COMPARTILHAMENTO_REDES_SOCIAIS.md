# 🔗 Guia: Compartilhamento Profissional em Redes Sociais

## Problema

Quando você compartilha o link do site em redes sociais (WhatsApp, Facebook, LinkedIn), **não aparece o preview profissional** com imagem, título e descrição.

---

## ✅ Como Funciona o Preview

As redes sociais leem as **meta tags Open Graph** do seu site:
- `og:title` → Título que aparece
- `og:description` → Descrição
- `og:image` → Imagem de destaque (ideal: 1200x630px)
- `og:url` → Link da página

---

## 🔧 Requisitos para Funcionar

### 1. Imagem de Compartilhamento

A imagem **DEVE**:
- ✅ Ter URL **HTTPS completa** (não relativa)
- ✅ Estar **publicamente acessível** (sem login)
- ✅ Tamanho ideal: **1200x630 pixels**
- ✅ Formato: **JPG** ou **PNG** (máx 8MB)
- ✅ Ser **quadrada ou landscape** (não portrait)

### 2. Configurar no Dashboard

Acesse `/dashboard/website` → Aba **"SEO e Metadados"**:

1. **Imagem de Compartilhamento (site_share_image_url)**
   - Faça upload de uma imagem 1200x630px
   - Pode ser: logo da imobiliária + fundo profissional
   - Ou: foto de imóvel de destaque

2. **Título do Site (site_title)**
   - Ex: "R&F Imobiliária - Imóveis em São Paulo"

3. **Descrição do Site (site_description)**
   - Ex: "Encontre seu imóvel dos sonhos com a R&F Imobiliária. Casas, apartamentos e terrenos para venda e locação."

---

## 🧪 Testar o Preview

### WhatsApp

1. **Limpar cache primeiro:**
   - Envie o link para você mesmo
   - Se não aparecer preview, WhatsApp está cacheado

2. **Forçar atualização:**
   - Use a ferramenta oficial do Facebook (WhatsApp usa a mesma):
   - https://developers.facebook.com/tools/debug/
   - Cole a URL do seu site
   - Clique em **"Fetch new information"**

### Facebook

https://developers.facebook.com/tools/debug/
- Cole a URL
- Clique em **"Fetch new information"**
- Veja o preview

### LinkedIn

https://www.linkedin.com/post-inspector/
- Cole a URL
- Veja o preview

### Twitter/X

https://cards-dev.twitter.com/validator
- Cole a URL
- Preview card

---

## 📋 Checklist de Verificação

Execute este SQL no Supabase para verificar suas configurações:

```sql
-- Verificar configurações de compartilhamento
SELECT 
  business_name,
  site_title,
  site_description,
  site_share_image_url,
  logo_url,
  header_brand_image_url
FROM brokers
WHERE website_slug = 'rfimobiliaria';
```

Verifique se:
- [ ] `site_share_image_url` está preenchido
- [ ] URL começa com `https://`
- [ ] Imagem existe e está acessível
- [ ] `site_title` está preenchido
- [ ] `site_description` está preenchida

---

## 🎨 Como Criar Imagem de Compartilhamento

### Opção 1: Canva (Gratuito)

1. Acesse https://canva.com
2. Escolha template **"Facebook Post"** (1200x630px)
3. Adicione:
   - Logo da imobiliária
   - Foto de fundo (imóvel bonito)
   - Texto: "R&F Imobiliária - Seu imóvel dos sonhos"
4. Baixe como **JPG**

### Opção 2: Photoshop/GIMP

- Tamanho: **1200x630 pixels**
- Resolução: 72 DPI
- Formato: JPG (qualidade 80-90%)

### Opção 3: Templates Prontos

Alguns exemplos de layout:

**Layout 1 - Minimalista:**
```
┌─────────────────────────────────┐
│                                 │
│     [LOGO]                      │
│                                 │
│   R&F Imobiliária              │
│   Imóveis em São Paulo         │
│                                 │
│   [Foto de imóvel de fundo]    │
│                                 │
└─────────────────────────────────┘
```

**Layout 2 - Split:**
```
┌─────────────┬───────────────────┐
│             │                   │
│   [FOTO     │  R&F Imobiliária  │
│    IMÓVEL]  │                   │
│             │  Encontre seu     │
│             │  imóvel dos       │
│             │  sonhos           │
│             │                   │
└─────────────┴───────────────────┘
```

---

## 🐛 Problemas Comuns

### Preview não aparece no WhatsApp

**Causa:** WhatsApp cacheia previews por **7 dias**

**Solução:**
1. Use Facebook Debugger para forçar atualização
2. Adicione `?v=1` no final da URL (ex: `site.com?v=1`)
3. Incremente o número quando alterar imagem

### Imagem cortada ou distorcida

**Causa:** Imagem não está em 1200x630px

**Solução:**
- Redimensione para exatamente 1200x630
- Use aspecto 1.91:1

### Imagem não carrega

**Causas possíveis:**
- URL não é HTTPS
- Imagem muito grande (>8MB)
- Imagem tem restrição de CORS
- URL relativa ao invés de absoluta

**Solução:**
- Faça upload no Supabase Storage
- Use URL completa: `https://seu-bucket.supabase.co/storage/v1/object/public/...`

---

## 📝 Exemplo de Configuração Completa

```typescript
// No Dashboard → Website → SEO e Metadados

site_title: "R&F Imobiliária - Imóveis em São Paulo"

site_description: "Encontre casas, apartamentos e terrenos para venda e locação. Atendimento especializado e imóveis exclusivos na melhor região de São Paulo."

site_share_image_url: "https://seu-bucket.supabase.co/storage/v1/object/public/property-images/share-image-rf-imobiliaria.jpg"
```

---

## 🚀 Resultado Esperado

Após configurar corretamente, quando compartilhar:

### WhatsApp:
```
┌─────────────────────────────────┐
│  [IMAGEM 1200x630]             │
│                                 │
│  R&F Imobiliária               │
│  Encontre seu imóvel dos...    │
│                                 │
│  rfimobiliaria.adminimobili... │
└─────────────────────────────────┘
```

### Facebook:
```
┌─────────────────────────────────┐
│  [IMAGEM GRANDE]               │
│                                 │
│  R&F Imobiliária - Imóveis     │
│  RFIMOBILIARIA.ADMINIMOBILIARIA.SITE
│  Encontre seu imóvel dos       │
│  sonhos com a R&F...           │
└─────────────────────────────────┘
```

---

## ✅ Ação Imediata

1. **Criar imagem 1200x630px no Canva**
2. **Fazer upload no Dashboard → Website → "Imagem de Compartilhamento"**
3. **Testar no Facebook Debugger**
4. **Compartilhar no WhatsApp**

**Isso dará um aspecto profissional ao compartilhar seus imóveis!** 🎉
