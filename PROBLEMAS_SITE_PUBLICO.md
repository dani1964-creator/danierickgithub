# Análise de Problemas - Site Público

## 🔍 Diagnóstico Completo Realizado

### ✅ Backend: TUDO FUNCIONANDO
- ✅ RPC `get_public_property_detail_with_realtor` retorna dados corretamente
- ✅ Migration slug-only executada (UUID bloqueado)
- ✅ Broker profile com background_image_url configurado
- ✅ Propriedades com slugs válidos
- ✅ Imagens acessíveis (HTTP 200)

### ❌ Problemas Identificados

#### 1. **Detalhes de Imóveis Não Aparecem**
**URL Acessada:** `danierick.adminimobiliaria.site/651438be-46db-4347-a3b4-508820abc1a0` (UUID)

**Causa Raiz:**
- Migration slug-only **bloqueou UUIDs** em URLs
- RPC retorna vazio para UUID → Frontend mostra "Propriedade não encontrada"

**Solução:**
Acessar URL correta com slug:
```
https://danierick.adminimobiliaria.site/casa-bela-vista-651438be
```

**Implementar Redirecionamento de UUID para Slug (Opcional):**
- Adicionar middleware para detectar UUID na URL
- Buscar slug correspondente no banco
- Redirecionar 301 para URL com slug

#### 2. **Banner Não Aparece no Hero**
**Status:** Background configurado corretamente no banco, imagem acessível (HTTP 200)

**Possíveis Causas:**
1. **Cache do navegador** (mais provável)
2. **CSP (Content Security Policy)** bloqueando imagem externa do Freepik
3. **Next/Image precisa de domínio na whitelist**

**Soluções:**

**A. Limpar Cache (Testar Primeiro)**
```
1. Abrir DevTools (F12)
2. Network tab
3. Disable cache (checkbox)
4. Hard refresh (Ctrl+Shift+R)
```

**B. Adicionar Freepik ao next.config.js**
```javascript
images: {
  domains: ['img.freepik.com']
}
```

**C. Verificar CSP Headers**
- Checar se há bloqueio no console do browser
- Adicionar `img-src` para Freepik se necessário

#### 3. **Imagem de Fundo "Quebrada" no Dashboard**
**URL da Imagem:** 
```
https://img.freepik.com/fotos-gratis/familia-jovem-com-seus-filhos-em-casa-se-divertindo_1303-20999.jpg?t=st=1755301589~exp=1755305189~hmac=d11419e64c59c88943a86a9144969edb49912529fefd751e557ff5e370ba20a4&w=1480
```

**Causa Raiz:**
- URL do Freepik com timestamp/token pode expirar
- Parâmetros de autenticação temporária (`exp=1755305189`)

**Soluções:**

**Opção 1: Usar URL Permanente do Freepik (Recomendado)**
```
https://img.freepik.com/fotos-gratis/familia-jovem-com-seus-filhos-em-casa-se-divertindo_1303-20999.jpg
```
(Remover parâmetros `?t=...&exp=...&hmac=...&w=...`)

**Opção 2: Fazer Upload da Imagem para Supabase Storage**
1. Baixar imagem
2. Upload via Dashboard → Identidade Visual
3. Usar URL do Supabase (permanente)

**Opção 3: Adicionar Fallback no Componente**
```tsx
<Image
  src={imageUrl}
  alt="Background"
  onError={(e) => {
    e.currentTarget.src = '/placeholder-background.jpg';
  }}
/>
```

## 📋 Checklist de Correções

### Correções Urgentes
- [ ] **Acessar URL correta:** Usar slug ao invés de UUID
- [ ] **Limpar cache do navegador:** Hard refresh
- [ ] **Atualizar imagem do Freepik:** Remover parâmetros temporários

### Melhorias Opcionais
- [ ] Implementar redirecionamento UUID → Slug no middleware
- [ ] Adicionar `img.freepik.com` ao next.config.js
- [ ] Fazer upload da imagem de fundo para Supabase Storage
- [ ] Adicionar fallback de erro em componentes de imagem

## 🔧 Próximos Passos

### 1. Testar URL Correta
```
https://danierick.adminimobiliaria.site/casa-bela-vista-651438be
```

### 2. Limpar Cache e Verificar Banner
- F12 → Network → Disable cache
- Ctrl+Shift+R (hard refresh)
- Verificar se banner aparece

### 3. Atualizar URL da Imagem de Fundo
Dashboard → Site → Identidade Visual:
```
De: https://img.freepik.com/...?t=st=1755301589~exp=...
Para: https://img.freepik.com/fotos-gratis/familia-jovem-com-seus-filhos-em-casa-se-divertindo_1303-20999.jpg
```

## 📊 Tabela de URLs

| Tipo | URL Antiga (❌) | URL Nova (✅) |
|------|----------------|--------------|
| Propriedade | `/651438be-46db-4347-a3b4-508820abc1a0` | `/casa-bela-vista-651438be` |
| Background | `...?t=st=1755301589~exp=...` | `.../familia-jovem-com-seus-filhos-em-casa-se-divertindo_1303-20999.jpg` |

## 🎯 Causa Raiz dos 3 Problemas

1. **Detalhes não aparecem:** UUID na URL (bloqueado pela migration)
2. **Banner não aparece:** Cache do navegador + possível CSP
3. **Imagem quebrada:** URL temporária do Freepik com token expirado
