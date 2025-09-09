# Sistema de Domínios Personalizados

## Visão Geral

O sistema agora suporta domínios personalizados, permitindo que múltiplas imobiliárias usem o mesmo slug (como `/home`) desde que cada uma tenha seu próprio domínio personalizado.

## Como Funciona

### 1. Prioridade de Busca
O sistema funciona com a seguinte lógica:
1. **Domínio Personalizado**: Se o usuário acessa via domínio personalizado (ex: `meusite.com`), busca pelo campo `custom_domain`
2. **Slug Padrão**: Se acessa via Lovable (ex: `lovable.app/home`), busca pelo campo `website_slug`

### 2. Configuração no Painel

#### No WebsiteSettings (`/dashboard/settings`):
- **URL do Site**: Campo `website_slug` - usado para acesso via lovable.app
- **Domínio Personalizado**: Campo `custom_domain` - usado para domínio próprio

Exemplo:
```
URL do Site: home
Domínio Personalizado: minhaimmobiliaria.com.br
```

### 3. Acesso aos Sites

#### Via Lovable:
- `lovable.app/home` → busca por `website_slug = 'home'`

#### Via Domínio Personalizado:
- `minhaimmobiliaria.com.br` → busca por `custom_domain = 'minhaimmobiliaria.com.br'`

## Vantagens

### ✅ Permite Slugs Duplicados
- Imobiliária A: `lovable.app/home` + `imobiliariaA.com`
- Imobiliária B: `lovable.app/home` + `imobiliariaB.com`
- Ambas podem usar `/home` sem conflito

### ✅ Flexibilidade
- Cada imobiliária pode ter seu próprio domínio
- Mantém compatibilidade com sistema atual
- Sem risco de dados conflitantes

### ✅ SEO Melhorado
- Domínio próprio melhora autoridade
- URLs mais profissionais
- Melhor branding

## Implementação Técnica

### Funções RPC Criadas
1. `get_broker_by_domain_or_slug()` - Busca broker por domínio ou slug
2. `get_properties_by_domain_or_slug()` - Busca propriedades por domínio ou slug

### Hook Personalizado
- `useDomainAware()` - Hook para facilitar uso das funções

### Detecção Automática
O sistema detecta automaticamente se é domínio personalizado:
```typescript
const currentDomain = window.location.hostname;
const isCustomDomain = !currentDomain.includes('lovable.app') && currentDomain !== 'localhost';
```

## Configuração no Vercel

Para configurar domínios personalizados no Vercel:

1. **No Painel do Vercel**:
   - Vá em Settings → Domains
   - Adicione o domínio personalizado
   - Configure os DNS conforme instruções

2. **DNS do Cliente**:
   ```
   Type: CNAME
   Name: @ (ou www)
   Value: cname.vercel-dns.com
   ```

3. **SSL**:
   - Vercel configura automaticamente
   - Certificado Let's Encrypt

## Exemplo de Uso

```typescript
// No componente
const { getBrokerByDomainOrSlug } = useDomainAware();

// Busca automática por domínio ou slug
const { data: broker } = await getBrokerByDomainOrSlug(slug);
```

## Migração

### Para Clientes Existentes
- Nenhuma alteração necessária
- Sistema mantém compatibilidade total
- Podem adicionar domínio personalizado quando quiserem

### Para Novos Clientes
- Podem começar direto com domínio personalizado
- Ou usar sistema tradicional com slug

## Segurança

- ✅ RLS policies mantidas
- ✅ Cada broker só acessa seus dados
- ✅ Validação de domínio no backend
- ✅ Rate limiting aplicado

## Conclusão

O sistema de domínios personalizados resolve completamente o problema de slugs duplicados, oferecendo flexibilidade total para as imobiliárias operarem com seus próprios domínios de forma independente e segura.