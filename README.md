# IMOBIDEPS — Sistema de Imóveis

IMOBIDEPS é uma plataforma completa para gestão e divulgação de imóveis, com painel administrativo, site público por imobiliária e integrações com Supabase.

Aplicação React + Vite + TypeScript com Tailwind e shadcn/ui.

## Como rodar localmente

Pré-requisitos: Node.js LTS e pnpm.

```sh
pnpm install
pnpm dev
```

Acesse http://localhost:8080

## Tecnologias

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Supabase JS

## Deploy na DigitalOcean App Platform (com multi-tenant por domínio)

Este projeto suporta subdomínios por corretora e domínios personalizados via tabela `broker_domains`.

### Variáveis de ambiente obrigatórias

- `VITE_SUPABASE_URL` — URL do projeto Supabase
- `VITE_SUPABASE_ANON_KEY` — anon key do Supabase
- `VITE_BASE_PUBLIC_DOMAIN` — domínio base da vitrine pública, ex.: `adminimobiliaria.site`
- `VITE_PUBLIC_APP_URL` — URL do app admin (usado em links), ex.: `https://app.adminimobiliaria.site`
- `VITE_CNAME_TARGET` — host de destino para CNAME (ex.: `your-app.ondigitalocean.app` ou `cname.suaedge.com`). A UI exibe esse alvo para os clientes.

### Passo a passo (App Platform)

1. Crie um novo app estático apontando para este repositório.
2. Build command: `pnpm i --frozen-lockfile && pnpm build`
3. Output directory: `dist`
4. Configure as variáveis de ambiente acima.
5. Depois de publicado, adicione domínios:
	- App admin: `app.adminimobiliaria.site` (opcional)
	- Vitrine base: `adminimobiliaria.site` (opcional, pode manter apenas wildcard)
	- Wildcard para subdomínios de corretores: `*.adminimobiliaria.site`

Checklist prático (DigitalOcean App Platform):
- [ ] Criar app na DO a partir do GitHub
- [ ] Definir envs (VITE_*) no painel do App Platform
- [ ] Anotar o domínio `SEU_APP.ondigitalocean.app` e setar `VITE_CNAME_TARGET` se aplicável
- [ ] Adicionar domínios do SaaS no app (admin + wildcard)
- [ ] Criar registros DNS (CNAME/A) no seu provedor apontando para o target fornecido pelo App Platform
- [ ] Verificar emissão de certificados na DO

### DNS (exemplo usando adminimobiliaria.site)

Crie os seguintes registros no seu provedor de DNS:

- CNAME `app` -> domínio do App Platform (ex.: `your-app.ondigitalocean.app`)
- CNAME `@` ou `www` (opcional) -> o mesmo domínio do App Platform
- CNAME `*` (wildcard) -> o mesmo domínio do App Platform

Com isso, URLs como `corretora1.adminimobiliaria.site` funcionarão automaticamente (resolução pelo `website_slug`).

### Domínios personalizados por corretora

Para apontar um domínio próprio (ex.: `vitrine.imobiliariax.com.br`):

1. No provedor de DNS do cliente, crie um CNAME do host desejado para o domínio do seu app na DigitalOcean (ex.: `your-app.ondigitalocean.app`).
2. No painel admin, vá em Configurações > Domínios personalizados e adicione exatamente o host (ex.: `vitrine.imobiliariax.com.br`).
3. Aguarde a propagação DNS e teste acessando o domínio. O sistema resolve o broker automaticamente.

Observação: a tabela `broker_domains` só permite SELECT público de domínios ativos e escrita restrita ao dono da corretora (políticas RLS já incluídas nas migrações).

Domínio raiz vs subdomínio (clientes):
- Subdomínio (ex.: `vitrine.cliente.com`): normalmente use CNAME apontando para `VITE_CNAME_TARGET`.
- Domínio raiz (ex.: `cliente.com`): muitos DNS não permitem CNAME no raiz. Use A/AAAA (ou ALIAS/ANAME) conforme instruções da plataforma (DO) ao adicionar o domínio para emitir SSL.

Provedores de domínio (clientes):
- Seus clientes podem usar qualquer registrador/provedor de DNS (registro.br, Hostinger, HostGator, Cloudflare, GoDaddy, etc.). As instruções são genéricas: criar CNAME (para subdomínio) ou A/AAAA (para raiz) apontando para o alvo informado. A UI do Settings exibe o “CNAME alvo”.

### Hospedagem e DNS

- Foco atual: DigitalOcean App Platform. Use o domínio `.ondigitalocean.app` como `VITE_CNAME_TARGET` e configure os domínios/custom domains no painel da DO.

Se você optar por um provedor de proxy/CDN (ex.: Cloudflare) fique atento às instruções desse provedor — porém o fluxo padrão é apontar CNAME/A para o target do App Platform.

### Subdomínios do SaaS x Admin

- Subdomínios do SaaS: `*.adminimobiliaria.site` servem as vitrines públicas por corretora.
- Admin/painel: idealmente fica em `app.adminimobiliaria.site` (ou outro subdomínio fixo).
- Domínios personalizados cadastrados por cada corretora (na UI de Configurações) afetam apenas a vitrine pública dessa corretora. As telas de administração continuam sob `app.adminimobiliaria.site` (ou o domínio fixo do SaaS), não migram para o domínio do cliente.

### Observação sobre o subdomínio do painel
- `VITE_PUBLIC_APP_URL` — URL do app admin (usado em links), ex.: `https://painel.adminimobiliaria.site`

	- App admin / Painel: `painel.adminimobiliaria.site` (opcional)

- Admin/painel: idealmente fica em `painel.adminimobiliaria.site` (ou outro subdomínio fixo).
- Domínios personalizados cadastrados por cada corretora (na UI de Configurações) afetam apenas a vitrine pública dessa corretora. As telas de administração continuam sob `painel.adminimobiliaria.site` (ou o domínio fixo do SaaS), não migram para o domínio do cliente.

### Build local

```sh
pnpm build
```

Sirva a pasta `dist/` com um servidor estático.
