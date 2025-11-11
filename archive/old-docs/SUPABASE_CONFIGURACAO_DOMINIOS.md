# ⚙️ Configuração de Domínios no Supabase

## 🚨 IMPORTANTE: URLs Permitidas no Supabase

Para que a autenticação funcione corretamente em diferentes domínios/subdomínios, você precisa adicionar as URLs no Supabase.

---

## 📝 Passo a Passo - Configurar no Supabase

### 1. Acessar o Dashboard do Supabase
```
https://supabase.com/dashboard
```

### 2. Selecionar seu projeto
```
Projeto: demcjskpwcxqohzlyjxb
```

### 3. Ir para Settings → Authentication
```
Menu lateral → Settings → Authentication
```

### 4. Encontrar "Site URL" e "Redirect URLs"

#### **Site URL** (URL principal)
```
http://localhost:5173
```
👆 Manter esse para desenvolvimento local

#### **Redirect URLs** (Adicionar as seguintes URLs)

**COPIE E COLE NO CAMPO "Additional Redirect URLs":**

```
http://localhost:5173/**
http://localhost:3000/**
https://adminimobiliaria.site/**
https://www.adminimobiliaria.site/**
https://painel.adminimobiliaria.site/**
https://*.adminimobiliaria.site/**
```

---

## 🎯 Por que isso é necessário?

### O Supabase Auth bloqueia requisições de domínios não autorizados por segurança.

Quando você acessa `painel.adminimobiliaria.site`, o Supabase verifica:

1. **Domínio de origem** → `painel.adminimobiliaria.site`
2. **Lista de URLs permitidas** → Se NÃO estiver na lista, **BLOQUEIA**
3. **Resultado** → Erro client-side: "Invalid redirect URL"

---

## ✅ URLs que devem estar configuradas

| URL | Propósito | Status Esperado |
|-----|-----------|-----------------|
| `http://localhost:5173/**` | Dev local (Vite) | ✅ Desenvolvimento |
| `http://localhost:3000/**` | Dev local (Next.js) | ✅ Desenvolvimento |
| `https://adminimobiliaria.site/**` | Domínio principal | ✅ Produção |
| `https://www.adminimobiliaria.site/**` | WWW | ✅ Produção |
| `https://painel.adminimobiliaria.site/**` | **PAINEL BROKER** | ⚠️ **ADICIONAR** |
| `https://*.adminimobiliaria.site/**` | **WILDCARD SUBDOMÍNIOS** | ⚠️ **ADICIONAR** |

---

## 🔧 Configuração Adicional - CORS

### Também precisa configurar CORS no Supabase:

1. **Settings → API**
2. **CORS Settings**
3. **Allowed Origins** → Adicionar:

```
http://localhost:5173
http://localhost:3000
https://adminimobiliaria.site
https://www.adminimobiliaria.site
https://painel.adminimobiliaria.site
https://*.adminimobiliaria.site
```

---

## 🎨 Configuração de Domínios Personalizados

Se um broker configurar `imobiliariajoao.com.br`, você precisa:

### Opção 1: Adicionar manualmente no Supabase
```
https://imobiliariajoao.com.br/**
```

### Opção 2: Usar wildcard (melhor)
```
https://*/**
```
⚠️ **Atenção**: Menos seguro, mas permite qualquer domínio

---

## 🐛 Como Verificar se é Problema de Domínio

### Abra o Console do Navegador (F12) e procure por:

```
Error: Invalid redirect URL
```

ou

```
Error: CORS policy blocked
```

ou

```
Error: auth/unauthorized-domain
```

**Se aparecer algum desses erros** → Problema de configuração de domínio no Supabase!

---

## 🚀 Solução Temporária para Testar

Enquanto não configura no Supabase, você pode testar acessando diretamente:

```
https://adminimobiliaria.site/dashboard
```

E fazer login lá. Depois o sistema funciona normalmente porque a sessão fica salva no localStorage.

---

## 📋 Checklist de Configuração

- [ ] Acessar Supabase Dashboard
- [ ] Settings → Authentication
- [ ] Adicionar em "Additional Redirect URLs":
  - [ ] `https://painel.adminimobiliaria.site/**`
  - [ ] `https://*.adminimobiliaria.site/**`
- [ ] Settings → API
- [ ] Adicionar em "Allowed Origins":
  - [ ] `https://painel.adminimobiliaria.site`
  - [ ] `https://*.adminimobiliaria.site`
- [ ] Salvar alterações
- [ ] Aguardar ~30 segundos para propagar
- [ ] Testar novamente: `painel.adminimobiliaria.site`

---

## 🎯 Resumo

O problema **NÃO É NO CÓDIGO**, é na **configuração do Supabase**!

**O `/admin` funciona** porque:
- Usa `adminimobiliaria.site/admin` (domínio principal)
- Domínio principal JÁ está configurado no Supabase ✅

**O `painel.adminimobiliaria.site` não funciona** porque:
- É um subdomínio diferente
- Subdomínio NÃO está configurado no Supabase ❌
- Supabase bloqueia por segurança 🔒

---

## ✅ Após Configurar no Supabase

O painel vai funcionar normalmente! 🎉

```
painel.adminimobiliaria.site
↓
Verifica sessão no Supabase ✅
↓
Redireciona para /auth se não logado
↓
Ou redireciona para /dashboard se logado
↓
Tudo funcionando! 🚀
```

---

**PRÓXIMO PASSO:** Configure no Supabase e teste novamente!
