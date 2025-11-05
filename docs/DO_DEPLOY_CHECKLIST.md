# Checklist de Configuração DigitalOcean App Platform

## ✅ Configurações Essenciais

### 1. Build Command
```bash
cd frontend && npm install && npm run build
```

**⚠️ IMPORTANTE:** Use `npm install` ao invés de `npm ci` para garantir instalação de devDependencies.

### 2. Output Directory
```
frontend/.next
```

### 3. Run Command (Production)
```bash
cd frontend && npm start
```

**⚠️ IMPORTANTE:** O `cd frontend` é obrigatório pois há um `package.json` na raiz que executa Vite. Sem o `cd`, o DO executa o build errado!

### 4. Environment Variables (App-Level)

**Públicas (NEXT_PUBLIC_*):**
```bash
NEXT_PUBLIC_BASE_PUBLIC_DOMAIN=adminimobiliaria.site
NEXT_PUBLIC_APP_URL=https://adminimobiliaria.site
NEXT_PUBLIC_CNAME_TARGET=adminimobiliaria.site
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Privadas (Server-Only):**
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NODE_ENV=production
```

**Opcionais (Dev/Testing):**
```bash
NEXT_PUBLIC_SA_EMAIL=seu-email@exemplo.com
NEXT_PUBLIC_SA_PASSWORD=sua-senha-super-admin
```

---

## 🌐 Domínios que Devem Estar Configurados

### No DigitalOcean (Settings → Domains)

1. **Domínio Principal:**
   - `adminimobiliaria.site`

2. **Wildcards (adicionar após domínio principal funcionar):**
   - `*.adminimobiliaria.site` → vitrines públicas
   - `*.painel.adminimobiliaria.site` → painéis de brokers

---

## 🔍 Verificações Pós-Deploy

### 1. Build Logs
Procurar por:
- ✅ `Compiled successfully`
- ✅ `Route (pages)` com 25 rotas listadas
- ❌ Erros de PostCSS, TypeScript ou ESLint

### 2. Runtime Logs
Procurar por:
- ✅ `Ready on http://0.0.0.0:8080` (ou porta configurada)
- ❌ Erros de conexão Supabase
- ❌ Erros de variáveis de ambiente

### 3. Testes de Acesso

```bash
# Super Admin
curl -I https://adminimobiliaria.site/admin
# Deve retornar: HTTP/2 200

# Verificar se middleware está funcionando
curl -I https://adminimobiliaria.site/ | grep x-app-type
# Deve retornar: x-app-type: saas-homepage
```

---

## 🐛 Troubleshooting

### Erro: "PostCSS configuration error"
**Solução:** ✅ Já corrigido! Arquivos renomeados para `.cjs`

### Erro: "Cannot find module @shared"
**Solução:** Verificar se `transpilePackages: ['@shared']` está no `next.config.js`

### Erro: "ENOENT: no such file or directory"
**Solução:** Verificar se Build Command está correto: `cd frontend && npm ci && npm run build`

### Build muito lento
**Solução:** 
- Verificar se `.next` e `node_modules` estão em `.gitignore`
- Considerar usar cache do DigitalOcean

---

## 📊 Comandos Úteis para Debug Local

```bash
# Testar build exatamente como DO fará
cd /workspaces/danierickgithub
rm -rf frontend/.next frontend/node_modules
cd frontend
npm ci
npm run build

# Ver tamanho do build
du -sh .next

# Testar servidor de produção localmente
npm start
```

---

## 🚨 Erros Comuns e Soluções

| Erro | Causa | Solução |
|------|-------|---------|
| `PostCSS syntax error` | Conflito module/commonjs | ✅ Renomear para `.cjs` |
| `404 on /admin` | Rotas não geradas | ✅ Arquivos renomeados para lowercase |
| `Middleware timeout` | Fetch para backend externo | ✅ Middleware com fallback standalone |
| `SUPABASE_SERVICE_ROLE_KEY not found` | Variável não configurada | Adicionar no App-Level Env |
| `Wildcard não funciona` | DNS não configurado | Adicionar CNAME no Cloudflare |
| `vite build` executado ao invés de `next build` | DO ignorando source_dir | ✅ Usar `cd frontend &&` nos comandos |
| `npm ci` pula devDependencies | Comando de build incorreto | ✅ Usar `npm install` ao invés de `npm ci` |

---

**Última atualização:** 2024-11-05 (após correção source_dir)
