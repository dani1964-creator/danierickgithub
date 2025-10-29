# Roteamento por Subdomínio - Implementação Completa

## 📋 Resumo das Mudanças Implementadas

### ✅ Concluído

1. **Configuração de Domínio Base**
   - Adicionado `VITE_BASE_PUBLIC_DOMAIN=adminimobiliaria.site` no `.env`
   - Configuração para identificar subdomínios `*.adminimobiliaria.site`

2. **Lógica de Resolução de Broker**
   - Implementada função `getCurrentBrokerByRequest()` em `/src/lib/tenant.ts`
   - Lógica baseada em `website_slug` exatamente como especificado
   - Suporte a domínios customizados via `broker_domains`
   - Reserva do subdomínio "admin" (retorna 404)

3. **DomainRouteHandler Atualizado**
   - Modificado `/src/components/layout/DomainRouteHandler.tsx`
   - Verificação automática de broker baseada no host
   - Redirecionamento para 404 customizado quando broker não encontrado

4. **Página 404 Customizada**
   - Criada `/src/pages/BrokerNotFound.tsx`
   - Mensagem específica para "vitrine não encontrada"
   - Design responsivo e informativo

5. **Hook useDomainAware Melhorado**
   - Atualizado `/src/hooks/useDomainAware.ts`
   - Usa nova lógica de resolução baseada em `website_slug`
   - Filtragem segura (apenas dados públicos, `is_active=true`)

6. **SEO e Canonical URLs**
   - Implementado `/src/lib/seo.ts` com funções para:
     - `generateCanonicalUrl()` - baseado em `canonical_prefer_custom_domain`
     - `generateRobotsContent()` - baseado em `robots_index/robots_follow`
   - Suporte completo às preferências de domínio customizado

## 🧪 Como Testar Localmente

### Método 1: Modificar /etc/hosts (Recomendado)

```bash
# Adicionar ao /etc/hosts (Linux/Mac) ou C:\Windows\System32\drivers\etc\hosts (Windows)
127.0.0.1  bucos.adminimobiliaria.site
127.0.0.1  teste.adminimobiliaria.site
127.0.0.1  admin.adminimobiliaria.site
```

Depois acesse:
- `http://bucos.adminimobiliaria.site:3001` - Se existir broker com `website_slug='bucos'`
- `http://teste.adminimobiliaria.site:3001` - Se existir broker com `website_slug='teste'`  
- `http://admin.adminimobiliaria.site:3001` - Deve mostrar página 404 (reservado)

### Método 2: Header X-Forwarded-Host (Para desenvolvimento)

```bash
# Usar curl ou ferramenta similar
curl -H "X-Forwarded-Host: bucos.adminimobiliaria.site" http://localhost:3001
```

### Método 3: Proxy de Desenvolvimento

Criar script `dev-proxy.js`:
```javascript
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

app.use('/', createProxyMiddleware({
  target: 'http://localhost:3001',
  changeOrigin: true,
  onProxyReq: (proxyReq, req, res) => {
    // Simular diferentes hosts baseado na porta
    const host = req.headers.host;
    if (host?.includes(':8081')) {
      proxyReq.setHeader('host', 'bucos.adminimobiliaria.site');
    } else if (host?.includes(':8082')) {
      proxyReq.setHeader('host', 'teste.adminimobiliaria.site');
    }
  }
}));

app.listen(8081, () => console.log('Proxy bucos: http://localhost:8081'));
app.listen(8082, () => console.log('Proxy teste: http://localhost:8082'));
```

## 🔧 Comandos para Teste

```bash
# 1. Certificar que o projeto está rodando
npm run dev

# 2. Verificar se broker existe (opcional)
node -e "
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
supabase.from('brokers').select('website_slug, business_name, is_active')
  .eq('is_active', true)
  .then(({data}) => console.log('Brokers ativos:', data?.map(b => b.website_slug)));
"

# 3. Testar resolução de broker
node -e "
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
supabase.from('brokers').select('*').eq('website_slug', 'bucos').eq('is_active', true)
  .then(({data, error}) => console.log('Broker bucos:', data?.[0] ? 'ENCONTRADO' : 'NÃO ENCONTRADO', error));
"
```

## 📡 Fluxo de Funcionamento

### Para Subdomínios (*.adminimobiliaria.site)

1. **Extração**: `bucos.adminimobiliaria.site` → `subdomain = "bucos"`
2. **Validação**: Se `subdomain === "admin"` → retorna `null` (404)
3. **Consulta**: `SELECT * FROM brokers WHERE website_slug = 'bucos' AND is_active = true`
4. **Resultado**: 
   - Se encontrado → carrega vitrine pública
   - Se não encontrado → página "Vitrine não encontrada"

### Para Domínios Customizados

1. **Consulta**: `SELECT broker_id FROM broker_domains WHERE domain = 'www.maisexpansaodeconsciencia.site' AND is_active = true`
2. **Broker**: `SELECT * FROM brokers WHERE id = broker_id AND is_active = true`
3. **Resultado**: Carrega vitrine do broker associado

## 🚀 Deploy e Configuração

### Variáveis de Ambiente Necessárias

```env
VITE_BASE_PUBLIC_DOMAIN=adminimobiliaria.site
VITE_SUPABASE_URL=https://demcjskpwcxqohzlyjxb.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Configuração DNS

Para produção, configurar wildcard DNS:
```
*.adminimobiliaria.site → IP do servidor
```

### Nginx/Apache

Configurar proxy_pass para repassar headers corretos:
```nginx
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
```

## ✅ Testes de Validação

- [ ] `http://bucos.adminimobiliaria.site:3001` → Vitrine do broker ou 404
- [ ] `http://admin.adminimobiliaria.site:3001` → Página 404 customizada  
- [ ] `http://inexistente.adminimobiliaria.site:3001` → Página 404 customizada
- [ ] `http://localhost:3001` → Dashboard de login (se configurado) ou público
- [ ] Canonical URLs corretas baseadas em `canonical_prefer_custom_domain`
- [ ] Meta robots baseadas em `robots_index/robots_follow`

---

**Status**: ✅ Implementação completa conforme especificação
**Próximos passos**: Testes locais e deploy para produção