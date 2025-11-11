# 🌐 Roteamento de Domínios - AdminImobiliária SaaS

## 📋 Estrutura de Domínios Atual

### 1. **Super Admin** ✅ FUNCIONANDO
**URL**: `adminimobiliaria.site/admin`

- **Propósito**: Painel do super administrador do SaaS
- **Acesso**: Exclusivo para administradores da plataforma
- **Funcionalidades**:
  - Gerenciar todas as imobiliárias cadastradas
  - Ativar/desativar imobiliárias
  - Monitoramento geral do sistema

---

### 2. **Painel das Imobiliárias** 🔧 AJUSTADO
**URL**: `painel.adminimobiliaria.site`

- **Propósito**: Painel administrativo para cada imobiliária
- **Autenticação**: Cada broker é identificado pela **sessão autenticada** (login), não pelo subdomínio
- **Por que SEM slug?**
  - ✅ Mais simples e direto
  - ✅ URL única para todos os brokers
  - ✅ Segurança via autenticação, não URL
  - ✅ Evita confusão: broker não precisa lembrar do slug para acessar o painel

**Rotas disponíveis**:
- `/painel/dashboard` - Dashboard principal
- `/painel/imoveis` - Gerenciar imóveis
- `/painel/leads` - Gerenciar leads
- `/painel/corretores` - Gerenciar corretores
- `/painel/configuracoes` - Configurações gerais
- `/painel/site` - **IMPORTANTE**: Configurar slug e domínio personalizado

---

### 3. **Vitrine Pública** 🎨 
**URLs possíveis**:
- Subdomínio: `{slug}.adminimobiliaria.site`
- Domínio personalizado: `imobiliariajoao.com.br`

- **Propósito**: Site público da imobiliária para visitantes/clientes
- **Slug configurado em**: `painel.adminimobiliaria.site/painel/site`
- **Funcionalidades**:
  - Listar imóveis disponíveis
  - Formulário de contato/leads
  - Informações da imobiliária
  - Branding personalizado (cores, logo, etc.)

---

## 🔄 Como Funciona o Wildcard DNS

### Configuração no Digital Ocean
Você configurou:
```
*.adminimobiliaria.site
adminimobiliaria.site
www.adminimobiliaria.site
```

### O que o wildcard `*` faz?
✅ **Captura TODOS os subdomínios automaticamente**, incluindo:
- `painel.adminimobiliaria.site` ✅
- `danierick.adminimobiliaria.site` ✅
- `joao.adminimobiliaria.site` ✅
- `maria.adminimobiliaria.site` ✅
- Qualquer outro subdomínio que você criar ✅

### **NÃO PRECISA** adicionar manualmente no Digital Ocean!
Quando um broker configura o slug no painel (ex: "joao"), o subdomínio `joao.adminimobiliaria.site` **já funciona automaticamente** graças ao wildcard!

---

## 🎯 Fluxo de Configuração para um Broker

### Passo 1: Broker faz login
```
URL: painel.adminimobiliaria.site
Ação: Fazer login com email/senha
Resultado: Sistema identifica o broker pela sessão
```

### Passo 2: Configurar Slug Amigável
```
URL: painel.adminimobiliaria.site/painel/site
Ação: Preencher campo "Slug do Site" (ex: "joao")
Resultado: Vitrine ficará em joao.adminimobiliaria.site
```

✅ **PRONTO!** O site público `joao.adminimobiliaria.site` **já está funcionando** imediatamente!

---

## 🌍 Domínios Personalizados (Opcional)

### Se o broker quiser usar seu próprio domínio:

**Exemplo**: `imobiliariajoao.com.br`

### Configuração necessária:

1. **Broker configura no painel**:
   ```
   URL: painel.adminimobiliaria.site/painel/site
   Campo: Domínio Personalizado
   Valor: imobiliariajoao.com.br
   ```

2. **Broker configura DNS** (no provedor de domínio dele):
   ```
   Tipo: CNAME
   Nome: @ (ou deixe vazio)
   Valor: adminimobiliaria.site
   TTL: Automático ou 3600
   ```

3. **Sistema verifica DNS**:
   - Clicar em "Verificar DNS" no painel
   - Sistema checa se CNAME está correto
   - Se OK, domínio fica ativo

✅ **Resultado**: Visitantes podem acessar em `imobiliariajoao.com.br`

---

## 🔍 Como o Sistema Detecta o Broker

### No Painel (painel.adminimobiliaria.site):
```typescript
// Middleware detecta: x-app-type = 'broker-panel'
// Broker identificado por: Sessão autenticada (user.id)
```

### Na Vitrine Pública:
```typescript
// Opção 1: Subdomínio
// joao.adminimobiliaria.site
// Extrai slug: "joao"
// Busca broker com: website_slug = "joao"

// Opção 2: Domínio personalizado
// imobiliariajoao.com.br
// Busca broker com: custom_domain = "imobiliariajoao.com.br"
```

---

## ⚠️ Possível Causa do Erro "Application Error"

O erro que você está vendo provavelmente é porque:

1. **Páginas do painel tentavam extrair slug do hostname**:
   ```typescript
   // CÓDIGO ANTIGO (ERRADO):
   const slug = hostname.split('.painel.')[0]; // ❌ Não há slug!
   ```

2. **Código já foi corrigido** para:
   ```typescript
   // CÓDIGO NOVO (CORRETO):
   // Broker identificado pela sessão autenticada ✅
   ```

---

## 🚀 Próximos Passos

### 1. **Testar o Painel** (após deploy):
```
URL: painel.adminimobiliaria.site
Ação: Fazer login
Esperado: Dashboard abrir normalmente
```

### 2. **Configurar Slug de Teste**:
```
URL: painel.adminimobiliaria.site/painel/site
Ação: Definir slug "teste"
Esperado: Campo salvar com sucesso
```

### 3. **Acessar Vitrine**:
```
URL: teste.adminimobiliaria.site
Esperado: Site público abrir (mesmo vazio, sem erro)
```

---

## 📝 Checklist de Verificação

- [x] Wildcard `*.adminimobiliaria.site` configurado no Digital Ocean
- [x] Middleware ajustado para `painel.adminimobiliaria.site` (sem slug)
- [x] Páginas do painel atualizadas
- [x] Código enviado para produção (commit 1387d84)
- [ ] **Aguardar deploy automático no Digital Ocean**
- [ ] Testar acesso ao painel
- [ ] Testar criação de slug
- [ ] Testar acesso à vitrine pública

---

## 🐛 Se Ainda Der Erro

### 1. **Verificar console do navegador** (F12):
Procurar por mensagens de erro específicas

### 2. **Verificar logs do servidor**:
No Digital Ocean, ver logs da aplicação

### 3. **Testar com usuário autenticado**:
Fazer login primeiro em `painel.adminimobiliaria.site`

### 4. **Limpar cache do navegador**:
Às vezes cache antigo causa problemas

---

## 📞 Resumo Técnico

| Domínio | Propósito | Identificação Broker | Status |
|---------|-----------|----------------------|--------|
| `adminimobiliaria.site/admin` | Super Admin | N/A (admin sistema) | ✅ OK |
| `painel.adminimobiliaria.site` | Painel Broker | Sessão autenticada | 🔧 Ajustado |
| `{slug}.adminimobiliaria.site` | Vitrine Pública | website_slug | ✅ OK |
| `dominio-personalizado.com.br` | Vitrine Pública | custom_domain | ✅ OK |

---

**✅ Correção aplicada no commit**: `1387d84`  
**🚀 Aguardando deploy automático no Digital Ocean**
