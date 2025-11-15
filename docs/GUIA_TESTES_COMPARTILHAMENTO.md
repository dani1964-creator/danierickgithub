# 🚀 GUIA DE TESTES - Compartilhamento com Imagens

## ✅ IMPLEMENTAÇÕES REALIZADAS

### 1. **Server-Side Rendering (SSR) Implementado**
- **Arquivo modificado:** `/frontend/pages/[propertySlug].tsx`
- **O que foi feito:**
  - Busca dados do imóvel e broker no servidor (getServerSideProps)
  - Injeta meta tags Open Graph no HTML inicial
  - Meta tags agora são visíveis para crawlers sociais (WhatsApp, Facebook, Twitter)

### 2. **Meta Tags Open Graph Otimizadas**
```html
<meta property="og:title" content="Apartamento 3 Quartos - Imobiliária Teste" />
<meta property="og:description" content="R$ 450.000 • 3 quartos • 2 banheiros • 120m²..." />
<meta property="og:image" content="https://...imagem-do-imovel.jpg" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:secure_url" content="https://..." />
<meta name="twitter:card" content="summary_large_image" />
```

---

## 📋 PASSO A PASSO PARA TESTAR

### **Teste 1: Verificar Imagens no Banco de Dados**

1. Acesse Supabase Dashboard → SQL Editor
2. Execute o arquivo: `/supabase/sql/VERIFICAR_IMAGENS_IMOVEIS.sql`
3. Verifique se seus imóveis têm `main_image_url` preenchida
4. **Se houver imóveis SEM imagem:**
   - Cadastre imagens nos imóveis OU
   - Configure `site_share_image_url` no broker

---

### **Teste 2: Deploy Local**

```bash
cd /workspaces/danierickgithub/frontend
npm run build
npm start
```

Acesse: `http://localhost:3000/[slug-do-imovel]`

---

### **Teste 3: Verificar Meta Tags no HTML**

**Método 1 - View Source (Recomendado):**
1. Abra qualquer página de imóvel no navegador
2. Clique com botão direito → **"View Page Source"** (ou Ctrl+U)
3. Procure por `og:image` no código-fonte
4. **✅ SUCESSO:** Se aparecer a tag com URL da imagem no HTML inicial
5. **❌ FALHA:** Se não aparecer ou aparecer vazia

**Método 2 - DevTools:**
```bash
curl -I https://danierick.adminimobiliaria.site/apartamento-teste-123 | head -20
```

---

### **Teste 4: Validadores de Redes Sociais**

#### **Facebook Sharing Debugger**
1. Acesse: https://developers.facebook.com/tools/debug/
2. Cole a URL do imóvel (ex: `https://danierick.adminimobiliaria.site/apartamento-centro`)
3. Clique em **"Debug"**
4. **Resultado esperado:**
   - ✅ Imagem aparece no preview
   - ✅ Título correto
   - ✅ Descrição com preço e detalhes
5. **Se não aparecer:** Clique em "Scrape Again"

#### **Twitter Card Validator**
1. Acesse: https://cards-dev.twitter.com/validator
2. Cole a URL do imóvel
3. Clique em **"Preview Card"**
4. **Resultado esperado:**
   - ✅ Card tipo "Summary Large Image"
   - ✅ Imagem em destaque

#### **LinkedIn Post Inspector**
1. Acesse: https://www.linkedin.com/post-inspector/
2. Cole a URL
3. Verifique preview

---

### **Teste 5: WhatsApp (Mais Importante)**

**Desktop (WhatsApp Web):**
1. Abra WhatsApp Web
2. Escolha um contato ou grupo
3. Cole a URL do imóvel
4. Aguarde 2-3 segundos
5. **✅ SUCESSO:** Aparece card com imagem + título + descrição

**Mobile:**
1. Abra WhatsApp no celular
2. Cole URL em uma conversa
3. Verifique preview

**⚠️ IMPORTANTE - Cache do WhatsApp:**
- WhatsApp faz cache agressivo (até 7 dias)
- Se já compartilhou antes, pode não atualizar imediatamente
- **Solução:** Adicione `?v=2` no final da URL: `https://site.com/imovel?v=2`

---

### **Teste 6: Compartilhamento Real**

1. Acesse página do imóvel no site público
2. Clique no botão **"Compartilhar"** (ícone Share2)
3. Escolha WhatsApp ou outra rede social
4. **Verifique:**
   - ✅ Imagem aparece no preview
   - ✅ Título do imóvel correto
   - ✅ Descrição com preço
   - ✅ URL correta

---

## 🔧 SOLUÇÃO DE PROBLEMAS

### ❌ Problema: "Imagem não aparece no compartilhamento"

**Causa 1: Imóvel sem imagem cadastrada**
```sql
-- Verificar:
SELECT id, title, main_image_url FROM properties WHERE slug = 'seu-imovel-slug';

-- Se main_image_url estiver NULL:
UPDATE properties 
SET main_image_url = 'https://sua-url-da-imagem.jpg'
WHERE slug = 'seu-imovel-slug';
```

**Causa 2: URL da imagem relativa (não absoluta)**
- ✅ Correto: `https://storage.supabase.co/...imagem.jpg`
- ❌ Errado: `/uploads/imagem.jpg`

**Causa 3: Cache do WhatsApp**
- Adicione `?v=` + timestamp na URL ao compartilhar
- Exemplo: `https://site.com/imovel?v=1731700000`

**Causa 4: Build não foi feito**
```bash
cd frontend
npm run build  # Sempre rodar após mudanças
```

---

### ❌ Problema: "Meta tags não aparecem no View Source"

**Solução:**
1. Limpar cache do navegador (Ctrl+Shift+Delete)
2. Rebuild do frontend: `npm run build`
3. Reiniciar servidor: `npm start`
4. Fazer hard refresh: Ctrl+Shift+R

---

### ❌ Problema: "Facebook Debugger mostra erro"

**Erros comuns:**

**"Could not resolve the hostname"**
- Site ainda não está no ar
- DNS não propagado
- Testar com ngrok: `ngrok http 3000`

**"Invalid image URL"**
- Imagem não acessível publicamente
- CORS bloqueando acesso
- Verificar URL no navegador anônimo

**"Image too small"**
- Facebook exige mínimo 200x200px
- Recomendado: 1200x630px
- Verificar dimensões da imagem

---

## 📊 VALIDAÇÃO FINAL

### ✅ Checklist de Sucesso

- [ ] Build do frontend compilou sem erros (`npm run build`)
- [ ] Arquivo `[propertySlug].tsx` modificado com SSR
- [ ] Meta tags `og:image` aparecem no "View Source"
- [ ] Facebook Debugger mostra preview da imagem
- [ ] Twitter Card Validator mostra card correto
- [ ] WhatsApp exibe preview com imagem ao colar URL
- [ ] Botão de compartilhamento funciona corretamente
- [ ] Imagens dos imóveis estão cadastradas no banco

---

## 🎯 PRÓXIMOS PASSOS

### Deploy em Produção

1. **Commit das mudanças:**
```bash
cd /workspaces/danierickgithub
git add frontend/pages/[propertySlug].tsx
git commit -m "feat: Adiciona SSR para meta tags Open Graph em páginas de imóveis"
git push origin main
```

2. **Deploy:**
```bash
./deploy-production.sh
```

3. **Validar em produção:**
- Testar URLs reais com Facebook Debugger
- Compartilhar em grupo de testes no WhatsApp
- Verificar analytics de compartilhamentos

---

## 📱 TESTE RÁPIDO (30 segundos)

```bash
# 1. Build
cd frontend && npm run build

# 2. Iniciar
npm start &

# 3. Testar meta tag
curl http://localhost:3000/apartamento-teste | grep "og:image"

# Resultado esperado:
# <meta property="og:image" content="https://...imagem.jpg"/>
```

Se aparecer a tag com URL completa → ✅ **FUNCIONANDO!**

---

## 🆘 SUPORTE

Se após todos os testes a imagem ainda não aparecer:

1. **Verificar logs do servidor:**
```bash
# No terminal onde rodou npm start:
# Procurar por erros de "Error fetching property data for SEO"
```

2. **Verificar resposta do servidor:**
```bash
curl -v https://seu-site.com/imovel-slug 2>&1 | grep -i "og:image"
```

3. **Testar com Postman:**
- Fazer GET na URL do imóvel
- Adicionar header: `User-Agent: facebookexternalhit/1.1`
- Verificar resposta HTML

---

**Status:** ✅ Implementação completa. Pronto para testes!
