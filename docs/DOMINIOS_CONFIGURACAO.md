# Guia de Configuração de Domínios e Subdomínios

## Visão Geral da Arquitetura

O sistema suporta **4 tipos de acesso**:

1. **Super Admin**: `adminimobiliaria.site/admin`
2. **Painel do Broker**: `painel.adminimobiliaria.site`
3. **Vitrine Pública (Subdomínio)**: `{slug}.adminimobiliaria.site`
4. **Vitrine Pública (Domínio Personalizado)**: `imobiliariajoao.com.br`

---

## 1. Configuração do Domínio Principal no DigitalOcean

### Passo 1: Adicionar Domínio ao App

1. Acesse o **DigitalOcean App Platform**
2. Vá em **Settings** → **Domains**
3. Clique em **Add Domain**
4. Digite: `adminimobiliaria.site`
5. Selecione **You manage your domain**
6. Clique em **Add Domain**

### Passo 2: Configurar DNS (Cloudflare)

No painel do Cloudflare, adicione os seguintes registros:

```
Tipo    Nome    Conteúdo                              Proxy   TTL
----------------------------------------------------------------------
A       @       <IP-DO-DIGITALOCEAN>                   ✅      Auto
CNAME   www     adminimobiliaria.site                  ✅      Auto
```

**Como obter o IP do DigitalOcean:**
- O DigitalOcean fornecerá o IP/CNAME após adicionar o domínio
- Geralmente é algo como: `your-app.ondigitalocean.app`

---

## 2. Configuração de Wildcards para Subdomínios

### No DigitalOcean

1. Em **Settings** → **Domains**, adicione:
   - `*.adminimobiliaria.site` (para vitrines: `{slug}.adminimobiliaria.site`)
   - `painel.adminimobiliaria.site` (subdomínio fixo do painel)

### No Cloudflare

Adicione registros:

```
Tipo    Nome     Conteúdo                              Proxy   TTL
----------------------------------------------------------------------
CNAME   *        adminimobiliaria.site                  ✅      Auto
A       @        <IP-DO-DIGITALOCEAN>                  ✅      Auto
CNAME   painel   adminimobiliaria.site                  ✅      Auto
```

⚠️ **Importante:** 
- Se usar Cloudflare, durante a configuração inicial deixe o proxy DESATIVADO (gray cloud) para evitar problemas de resolução enquanto os registros e certificados são provisionados. Depois de tudo funcionando, você pode avaliar ativar recursos do Cloudflare.

---

## 3. Configuração SSL/TLS no Cloudflare

1. Vá em **SSL/TLS** → **Overview**
2. Selecione modo: **Full (strict)**
3. Em **Edge Certificates**:
   - Ative **Always Use HTTPS**
   - Ative **Automatic HTTPS Rewrites**
   - Ative **Minimum TLS Version**: TLS 1.2

---

## 4. Domínios Personalizados (Brokers)

### Como o Broker Configura

1. Acessa: `{slug}.painel.adminimobiliaria.site/painel/site`
2. Em **Domínio Personalizado**, insere: `imobiliariajoao.com.br`
3. Clica em **Salvar**
4. Sistema exibe instruções DNS

### Instruções DNS para o Cliente (Broker)

O broker precisa configurar no painel do registrador dele:

**Opção 1 - CNAME (Recomendado para www):**
```
Tipo    Nome    Conteúdo                              TTL
-----------------------------------------------------------
CNAME   www     whale-app-w84mh.ondigitalocean.app    Auto
```

**Opção 2 - CNAME no registro raiz (se o provedor permitir):**
```
Tipo    Nome    Conteúdo                              TTL
-----------------------------------------------------------
CNAME   @       whale-app-w84mh.ondigitalocean.app    Auto
```

**Opção 3 - ALIAS/ANAME (se CNAME não for permitido no @):**
```
Tipo     Nome    Conteúdo                              TTL
-----------------------------------------------------------
ALIAS    @       whale-app-w84mh.ondigitalocean.app    Auto
```

⚠️ **Observações Importantes:**
- O destino **DEVE SER** `whale-app-w84mh.ondigitalocean.app` (URL do app no DigitalOcean)
- **NÃO** use `adminimobiliaria.site` como destino (isso causaria loop de redirecionamento)
- Se o registrador não aceitar CNAME no registro raiz (@), use ALIAS ou ANAME
- Alguns provedores DNS (Registro.br, por exemplo) não permitem CNAME no @, prefira usar `www.seudominio.com.br`

```
Tipo    Nome    Conteúdo                              TTL
------------------------------------------------------------
A       @       <IP-DO-DIGITALOCEAN>                   Auto
CNAME   www     adminimobiliaria.site                  Auto
```

### Verificação DNS (Backend)

Criar endpoint `/api/verify-domain` que:

1. Faz lookup DNS do domínio personalizado
2. Verifica se CNAME aponta para `adminimobiliaria.site`
3. Atualiza campo `custom_domain_verified = true` no banco

```typescript
// Exemplo de verificação (Node.js)
const dns = require('dns').promises;

async function verifyDomain(domain: string): Promise<boolean> {
  try {
    const records = await dns.resolveCname(domain);
    return records.some(r => r.includes('adminimobiliaria.site'));
  } catch (error) {
    return false;
  }
}
```

---

## 5. Variáveis de Ambiente

Configure no **DigitalOcean App Platform** → **Settings** → **Environment Variables**:

```bash
# Domínio base do SaaS
NEXT_PUBLIC_BASE_PUBLIC_DOMAIN=adminimobiliaria.site

# URL do app (para redirects e canonical URLs)
NEXT_PUBLIC_APP_URL=https://adminimobiliaria.site

# Target para CNAME (usado nas instruções DNS)
NEXT_PUBLIC_CNAME_TARGET=adminimobiliaria.site

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## 6. Testando a Configuração

### Testes Locais com /etc/hosts

Adicione no `/etc/hosts` (para testar localmente):

```
127.0.0.1  adminimobiliaria.site
127.0.0.1  danierick.adminimobiliaria.site
127.0.0.1  painel.adminimobiliaria.site
127.0.0.1  imobiliariajoao.com.br
```

Execute:
```bash
cd frontend
npm run dev
```

Acesse:
- http://adminimobiliaria.site:3000/admin (Super Admin)
- http://painel.adminimobiliaria.site:3000/painel/dashboard (Painel)
- http://danierick.adminimobiliaria.site:3000 (Vitrine)

### Testes em Produção

```bash
# Verificar DNS
dig adminimobiliaria.site
dig danierick.adminimobiliaria.site
dig painel.adminimobiliaria.site

# Testar SSL
curl -I https://adminimobiliaria.site
curl -I https://painel.adminimobiliaria.site

# Verificar headers do middleware
curl -I https://painel.adminimobiliaria.site | grep x-app-type
```

---

## 7. Troubleshooting

### Problema: Subdomínio retorna 404

**Causa:** Wildcard não configurado ou DNS não propagado

**Solução:**
1. Verifique se `*.adminimobiliaria.site` está no Cloudflare
2. Aguarde propagação DNS (até 48h, geralmente minutos)
3. Teste com `dig`:
   ```bash
   dig teste.adminimobiliaria.site
   ```

### Problema: Domínio personalizado não funciona

**Causa:** DNS do cliente não configurado ou não propagado

**Solução:**
1. Peça ao cliente para verificar DNS:
   ```bash
   dig imobiliariajoao.com.br
   ```
2. Deve retornar IP do DigitalOcean ou CNAME para adminimobiliaria.site
3. Teste verificação:
   ```bash
   curl https://adminimobiliaria.site/api/verify-domain?domain=imobiliariajoao.com.br
   ```

### Problema: SSL não funciona

**Causa:** Cloudflare proxy desligado ou modo SSL incorreto

**Solução:**
1. No Cloudflare, certifique-se que a nuvem está **laranja** (proxied)
2. SSL/TLS mode: **Full (strict)**
3. Aguarde alguns minutos para provisionar certificado

---

## 8. Fluxo Completo de Criação de Broker

```mermaid
graph TD
    A[Super Admin cria Broker] --> B[Define business_name]
    B --> C[Sistema gera website_slug automático]
    C --> D[Broker acessa {slug}.painel.adminimobiliaria.site]
    D --> E{Broker quer domínio personalizado?}
    E -->|Não| F[Usa {slug}.adminimobiliaria.site]
    E -->|Sim| G[Configura custom_domain]
    G --> H[Configura DNS no registrador]
    H --> I[Clica em Verificar DNS]
    I --> J{DNS válido?}
    J -->|Sim| K[custom_domain_verified = true]
    J -->|Não| L[Exibe erro e instruções]
    K --> M[Vitrine disponível no domínio personalizado]
```

---

## 9. Referências e Links Úteis

- [DigitalOcean: Custom Domains](https://docs.digitalocean.com/products/app-platform/how-to/manage-domains/)
- [Cloudflare: DNS Records](https://developers.cloudflare.com/dns/manage-dns-records/how-to/create-dns-records/)
- [Next.js: Multi-tenant Architecture](https://nextjs.org/docs/advanced-features/multi-zones)

---

**Criado em:** 2024-11-05  
**Atualizado em:** 2024-11-05
