# 📤 Como Adicionar Imagens no Supabase Storage

## 🎯 Passo a Passo Completo

### 1️⃣ Acessar o Supabase Dashboard

1. Abra: https://supabase.com/dashboard
2. Faça login com sua conta
3. Selecione seu projeto (adminimobiliaria)

---

### 2️⃣ Criar o Bucket (se ainda não existir)

1. No menu lateral esquerdo, clique em **"Storage"**
2. Clique em **"New bucket"** (ou use um existente)
3. Preencha:
   - **Name:** `public-assets` (ou outro nome)
   - **Public bucket:** ✅ Marque esta opção (importante!)
   - **File size limit:** 5MB (ou ajuste conforme necessário)
4. Clique em **"Create bucket"**

---

### 3️⃣ Criar Pasta "marketing"

1. Clique no bucket **public-assets**
2. Clique em **"Create new folder"**
3. Nome da pasta: `marketing`
4. Clique em **"Create folder"**

---

### 4️⃣ Upload das Imagens

#### Opção A: Upload Manual (Recomendado)

1. Abra a pasta `marketing`
2. Clique em **"Upload file"**
3. Selecione as imagens em:
   ```
   /workspaces/danierickgithub/frontend/public/marketing/
   ```
4. Selecione todas as 6 imagens:
   - gestao-imoveis.png
   - captacao-leads-1.png
   - captacao-leads-2.png
   - sites-personalizados.png
   - analytics-1.png
   - analytics-2.png
5. Clique em **"Upload"**

#### Opção B: Upload via CLI (Avançado)

Se preferir usar a linha de comando:

```bash
# 1. Instalar Supabase CLI (se ainda não tiver)
npm install -g supabase

# 2. Login
supabase login

# 3. Link com o projeto
supabase link --project-ref SEU_PROJECT_REF

# 4. Upload das imagens
supabase storage cp /workspaces/danierickgithub/frontend/public/marketing/*.png \
  supabase://public-assets/marketing/
```

---

### 5️⃣ Obter URLs Públicas

Depois do upload, para cada imagem:

1. Clique na imagem
2. Copie a **"Public URL"** (botão de copiar)
3. A URL será algo como:
   ```
   https://SEU_PROJECT_ID.supabase.co/storage/v1/object/public/public-assets/marketing/gestao-imoveis.png
   ```

---

### 6️⃣ Atualizar o Código

**Opção A: URLs Completas**

Cole aqui as URLs que você copiou e eu atualizo o código automaticamente!

Formato esperado:
```
Gestão: https://xxx.supabase.co/storage/.../gestao-imoveis.png
Captação 1: https://xxx.supabase.co/storage/.../captacao-leads-1.png
Captação 2: https://xxx.supabase.co/storage/.../captacao-leads-2.png
Sites: https://xxx.supabase.co/storage/.../sites-personalizados.png
Analytics 1: https://xxx.supabase.co/storage/.../analytics-1.png
Analytics 2: https://xxx.supabase.co/storage/.../analytics-2.png
```

**Opção B: Configurar Variável de Ambiente**

Se preferir deixar dinâmico:

```typescript
// .env.local
NEXT_PUBLIC_SUPABASE_STORAGE_URL=https://SEU_PROJECT_ID.supabase.co/storage/v1/object/public

// No código (index.tsx)
const STORAGE_URL = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_URL;

<PhoneMockup
  images={[`${STORAGE_URL}/public-assets/marketing/gestao-imoveis.png`]}
  ...
/>
```

---

### 7️⃣ Configurar next.config.js (Já está pronto!)

O domínio Supabase já está configurado:

```javascript
// next.config.js (já existe)
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: '*.supabase.co', // ✅ Já configurado!
    }
  ]
}
```

---

## 🎨 Vantagens do Supabase Storage

✅ **CDN Global** - Imagens servidas rapidamente em todo o mundo
✅ **Cache Inteligente** - Reduz tempo de carregamento
✅ **Transformações** - Redimensionamento automático (se configurar)
✅ **Backup Automático** - Supabase faz backup dos arquivos
✅ **Grátis** - Até 1GB de storage
✅ **Sem compressão** - Qualidade 100% preservada

---

## 📊 Comparação

| Método | Qualidade | Velocidade | Manutenção | Custo Build |
|--------|-----------|------------|------------|-------------|
| **Supabase Storage** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 0MB |
| **Public Folder** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | +1.1MB |
| **ImgBB** | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 0MB |

---

## 🔧 Troubleshooting

### Erro: "Bucket not found"
- Certifique-se que marcou "Public bucket" ao criar

### Erro: "Access denied"
- Verifique as RLS policies do bucket
- Bucket precisa permitir leitura pública

### Imagens não aparecem
- Verifique se a URL está correta
- Teste a URL diretamente no navegador
- Confirme que o bucket é público

---

## 📝 Próximo Passo

**Faça o upload das imagens no Supabase Dashboard e me envie as URLs!**

Eu atualizo o código automaticamente para você! 🚀

---

**Precisa de ajuda?** Cole aqui a URL de uma imagem depois do upload que eu configuro tudo!
