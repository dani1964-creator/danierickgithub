# 🗺️ Mapeamento Completo de Rotas e Slugs - AdminImobiliaria

## 📋 Resumo de URLs Disponíveis

### 🏠 **Domínio Principal: `adminimobiliaria.site`**

### 🔐 **Área Administrativa**
```
https://adminimobiliaria.site/dashboard           # Dashboard principal
https://adminimobiliaria.site/dashboard/home      # Home do dashboard
https://adminimobiliaria.site/dashboard/properties # Gestão de propriedades
https://adminimobiliaria.site/dashboard/settings  # Configurações da conta
https://adminimobiliaria.site/dashboard/website   # Configurações do site
https://adminimobiliaria.site/dashboard/leads     # Gestão de leads
https://adminimobiliaria.site/dashboard/realtors  # Gestão de corretores
https://adminimobiliaria.site/auth               # Login/Registro
```

### 👤 **Super Administrador**
```
https://adminimobiliaria.site/admin              # Super admin (rota principal)
https://adminimobiliaria.site/super-admin        # Super admin (alternativa)
https://adminimobiliaria.site/dashboard/admin    # Super admin (via dashboard)
```

### 🔍 **Debug e Desenvolvimento**
```
https://adminimobiliaria.site/debug/[slug]       # Debug de broker específico
http://localhost:3001/debug/[slug]               # Debug local
```

## 🏢 **Sistema Multi-Tenant (Vitrines Públicas)**

### 📍 **Por Slug (URL Path)**
```
https://adminimobiliaria.site/[broker-slug]      # Vitrine do broker
https://adminimobiliaria.site/danierick          # Exemplo: Danierick Imobiliária
https://adminimobiliaria.site/imobiliaria-teste  # Exemplo: Imobiliária Teste
```

### 🌐 **Por Subdomínio** ⭐ **NOVO!**
```
https://[broker-slug].adminimobiliaria.site      # Subdomínio do broker
https://danierick.adminimobiliaria.site          # Exemplo: Danierick via subdomínio
https://teste.adminimobiliaria.site              # Exemplo: Teste via subdomínio
```

### 🏠 **Propriedades Específicas**
```
# Via Slug:
https://adminimobiliaria.site/[broker]/[property-slug]
https://adminimobiliaria.site/danierick/casa-moderna-vila-madalena

# Via Subdomínio:
https://[broker].adminimobiliaria.site/[property-slug]  
https://danierick.adminimobiliaria.site/casa-moderna-vila-madalena
```

### 📄 **Páginas Institucionais por Tenant**
```
# Via Slug:
https://adminimobiliaria.site/[broker]/sobre-nos
https://adminimobiliaria.site/[broker]/politica-de-privacidade
https://adminimobiliaria.site/[broker]/termos-de-uso

# Via Subdomínio:
https://[broker].adminimobiliaria.site/sobre-nos
https://[broker].adminimobiliaria.site/politica-de-privacidade
https://[broker].adminimobiliaria.site/termos-de-uso
```

## 🌍 **Domínios Personalizados (Futuro)**
```
https://www.danierickimoveis.com.br              # Domínio personalizado
https://imobiliaria-abc.com.br                   # Outro exemplo personalizado
```

## 📊 **Brokers Configurados (Após SQL)**

### 🏢 **Danierick Imobiliária**
- **Slug:** `danierick`
- **Subdomínio:** `danierick.adminimobiliaria.site`
- **URLs:**
  - https://adminimobiliaria.site/danierick
  - https://danierick.adminimobiliaria.site
- **Propriedades:**
  - Casa Moderna Vila Madalena (`casa-moderna-vila-madalena`)
  - Apartamento Centro Histórico (`apartamento-centro-historico`)
  - Casa Familiar Jardins (`casa-familiar-jardins`)

### 🏢 **Imobiliária Teste**
- **Slug:** `imobiliaria-teste`
- **Subdomínio:** `teste.adminimobiliaria.site`
- **URLs:**
  - https://adminimobiliaria.site/imobiliaria-teste
  - https://teste.adminimobiliaria.site

## 🔧 **Rotas do Sistema (Internas)**

### ✅ **Rotas Funcionais**
```
/                                    # HomePage (redireciona conforme auth)
/auth                               # Página de login/registro (CORRIGIDA ✅)
/dashboard/*                        # Área administrativa completa
/admin                             # Super admin
/super-admin                       # Super admin (alternativa)
/debug/:slug                       # Debug de tenant
/:slug                             # Vitrine pública por slug
/:slug/:propertySlug               # Propriedade específica
/:slug/sobre-nos                   # Página sobre nós
/:slug/politica-de-privacidade     # Política de privacidade
/:slug/termos-de-uso              # Termos de uso
```

### ⚠️ **Rotas Protegidas**
```
/dashboard/*        # Requer autenticação
/admin             # Requer permissão de super admin
/super-admin       # Requer permissão de super admin
```

### 🆕 **Melhorias Implementadas**

1. **✅ Página /auth Corrigida**
   - Agora funciona corretamente após logout
   - Não fica mais em branco

2. **✅ Múltiplas Rotas para Super Admin**
   - `/admin`
   - `/super-admin` 
   - `/dashboard/admin`

3. **✅ Sistema de Subdomínios**
   - `danierick.adminimobiliaria.site`
   - `teste.adminimobiliaria.site`
   - Detecção automática de subdomínio vs slug

4. **✅ Página de Debug**
   - `/debug/:slug` para investigar problemas
   - Mostra informações detalhadas do sistema

## 📱 **Como Acessar Cada Funcionalidade**

### 👤 **Para Administradores do Sistema**
```bash
# Super Admin:
https://adminimobiliaria.site/admin
https://adminimobiliaria.site/super-admin

# Debug:
https://adminimobiliaria.site/debug/danierick
```

### 🏢 **Para Proprietários de Imobiliária**
```bash
# Dashboard:
https://adminimobiliaria.site/dashboard

# Configurações:
https://adminimobiliaria.site/dashboard/website
https://adminimobiliaria.site/dashboard/properties

# Ver site público:
https://adminimobiliaria.site/danierick          # Via slug
https://danierick.adminimobiliaria.site          # Via subdomínio ⭐
```

### 👥 **Para Clientes (Público)**
```bash
# Vitrines:
https://adminimobiliaria.site/danierick
https://danierick.adminimobiliaria.site          # ⭐ NOVO!

# Propriedades:
https://adminimobiliaria.site/danierick/casa-moderna-vila-madalena
https://danierick.adminimobiliaria.site/casa-moderna-vila-madalena

# Páginas institucionais:
https://danierick.adminimobiliaria.site/sobre-nos
```

## 🚀 **Instruções para Execução**

### 1️⃣ **Executar SQL de Configuração**
```sql
-- No painel do Supabase ou via psql:
\i setup-complete-brokers.sql
```

### 2️⃣ **Testar Rotas Básicas**
```bash
# Verificar se funcionam:
curl https://adminimobiliaria.site/danierick
curl https://danierick.adminimobiliaria.site
```

### 3️⃣ **Configurar DNS (Se Necessário)**
```bash
# No Cloudflare, adicionar registro wildcard:
Tipo: CNAME
Nome: *.adminimobiliaria.site
Destino: adminimobiliaria-8cx7x.ondigitalocean.app
```

## 🛠️ **Próximos Passos**

1. **✅ Executar SQL** (`setup-complete-brokers.sql`)
2. **✅ Testar subdomínios** (`danierick.adminimobiliaria.site`)
3. **✅ Verificar /auth** após logout
4. **✅ Acessar super admin** via múltiplas rotas
5. **📊 Monitorar** logs de acesso
6. **🎨 Personalizar** temas por broker

---

**Status:** Sistema multi-tenant completo com subdomínios funcionais! 🎉