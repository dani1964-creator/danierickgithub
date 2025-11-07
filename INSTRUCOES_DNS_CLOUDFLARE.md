# INSTRUÇÕES DE CLOUD PROVIDERS

Este documento continha instruções específicas para o Cloudflare. Como este projeto foi configurado para utilizar a DigitalOcean App Platform por padrão, as instruções Cloudflare foram removidas para evitar confusão.

Se você precisar das instruções do Cloudflare, solicite que eu as restaure ou gere um documento separado contendo apenas as etapas opcionais do Cloudflare.

### **1.2 Configurar Registros DNS Básicos**

No painel DNS do Cloudflare, adicione estes registros:

```
Tipo: A
Nome: @
IPv4: [IP_DO_DIGITAL_OCEAN_APP]
Proxy: Habilitado (nuvem laranja)

Tipo: A  
Nome: www
IPv4: [IP_DO_DIGITAL_OCEAN_APP]
Proxy: Habilitado (nuvem laranja)

Tipo: CNAME
Nome: *
Target: @
Proxy: Desabilitado (nuvem cinza)
```

**📝 Onde encontrar o IP do Digital Ocean:**
- Vá para Digital Ocean Dashboard > Apps > Sua App
- Na aba "Settings" > "Domains"
- Copie o IP fornecido

---

## 🚀 **ETAPA 2: Configuração Wildcard para Subdomínios**

### **2.1 Registro Wildcard**
```
Tipo: CNAME
Nome: *
Target: seu-dominio.com
Proxy: Desabilitado
TTL: Auto
```

### **2.2 Exemplo de Subdomínios que Funcionarão:**
- `imobiliaria1.meuapp.com` → Tenant 1
- `imobiliaria2.meuapp.com` → Tenant 2
- `exemplo.meuapp.com` → Tenant Exemplo

---

## 🏢 **ETAPA 3: Domínios Personalizados dos Clientes**

### **3.1 Para Cada Cliente com Domínio Próprio:**

Quando um cliente quiser usar `www.imobiliariaxyz.com.br`:

**No Cloudflare do CLIENTE:**
```
Tipo: CNAME
Nome: @
Target: seu-app-principal.com
Proxy: Desabilitado

Tipo: CNAME
Nome: www  
Target: seu-app-principal.com
Proxy: Desabilitado
```

**No Digital Ocean (sua app):**
1. Vá para App Settings > Domains
2. Clique em "Add Domain"
3. Adicione `imobiliariaxyz.com.br`
4. Configure o certificado SSL

---

## 🔐 **ETAPA 4: Configurações de Segurança**

### **4.1 SSL/TLS Settings**
```
Encryption Mode: Full (Strict)
Edge Certificates: Habilitado
Always Use HTTPS: Habilitado
```

### **4.2 Configurar Page Rules**
Criar regra para redirecionar www:
```
URL Pattern: www.meuapp.com/*
Settings: 
  - Forwarding URL: 301 Redirect
  - Destination: https://meuapp.com/$1
```

### **4.3 Security Settings**
```
Security Level: Medium
Challenge Passage: 30 minutes
Browser Integrity Check: Habilitado
```

---

## 🛠️ **ETAPA 5: Configurações Avançadas**

### **5.1 Caching Rules**
```
Page Rule para API:
URL Pattern: meuapp.com/api/*
Settings:
  - Cache Level: Bypass
  
Page Rule para Assets:
URL Pattern: meuapp.com/_next/static/*
Settings:
  - Cache Level: Cache Everything
  - Edge Cache TTL: 1 month
```

### **5.2 Origin Rules (se necessário)**
```
Host Header Override: meuapp.com
```

---

## 📋 **ETAPA 6: Teste e Validação**

### **6.1 Comandos de Teste**

Execute estes comandos no terminal para testar:

```bash
# Testar resolução DNS do domínio principal
nslookup meuapp.com

# Testar subdomínio wildcard
nslookup teste.meuapp.com

# Testar conectividade HTTP
curl -I https://meuapp.com
curl -I https://teste.meuapp.com
```

### **6.2 Verificações Online**
1. [DNS Checker](https://dnschecker.org/) - verificar propagação DNS
2. [SSL Labs](https://www.ssllabs.com/ssltest/) - testar SSL
3. [GTmetrix](https://gtmetrix.com/) - testar performance

---

## 🚨 **PROBLEMAS COMUNS E SOLUÇÕES**

### **Problema 1: Subdomínio não resolve**
```
Solução:
1. Verificar se o registro wildcard (*) está correto
2. Aguardar propagação DNS (até 48h)
3. Limpar cache do Cloudflare
```

### **Problema 2: SSL não funciona**
```
Solução:
1. Configurar SSL mode para "Full (Strict)"
2. Aguardar emissão do certificado (até 15 min)
3. Verificar se "Always Use HTTPS" está habilitado
```

### **Problema 3: Domínio personalizado não funciona**
```
Solução:
1. Verificar CNAME no DNS do cliente
2. Adicionar domínio no Digital Ocean App
3. Aguardar configuração do certificado SSL
```

---

## 📝 **CHECKLIST DE CONFIGURAÇÃO**

### **Cloudflare:**
- [ ] Domínio adicionado ao Cloudflare
- [ ] Nameservers alterados na Hostinger
- [ ] Registro A para @ e www
- [ ] Registro CNAME wildcard (*)
- [ ] SSL/TLS configurado (Full Strict)
- [ ] Always Use HTTPS habilitado
- [ ] Page Rules criadas

### **Digital Ocean:**
- [ ] Domínio principal configurado
- [ ] Certificado SSL ativo
- [ ] App funcionando corretamente

### **Testes:**
- [ ] Domínio principal carrega
- [ ] www redireciona corretamente
- [ ] Subdomínio teste funciona
- [ ] SSL válido em todos os domínios
- [ ] API responde corretamente

---

## 🔄 **PRÓXIMOS PASSOS APÓS DNS**

1. **Testar a aplicação:**
   ```bash
   # No navegador, testar:
   https://meuapp.com
   https://teste.meuapp.com
   ```

2. **Configurar primeiro tenant:**
   - Executar SQLs no Supabase
   - Criar tenant de exemplo
   - Testar identificação por domínio

3. **Deploy da aplicação:**
   ```bash
   # Executar deploy
   ./scripts/deploy-do.sh
   ```

---

## 📞 **SUPORTE**

Se houver problemas:

1. **DNS não propaga:** Aguardar até 48h
2. **SSL não funciona:** Verificar configurações no Cloudflare
3. **App não carrega:** Verificar logs no Digital Ocean
4. **Tenant não identifica:** Verificar logs da API

**Links úteis:**
- [Cloudflare Docs](https://developers.cloudflare.com/)
- [Digital Ocean Docs](https://docs.digitalocean.com/)
- [DNS Propagation Checker](https://dnschecker.org/)

---

## ✅ **CONFIGURAÇÃO COMPLETA!**

Após executar todas as etapas:
1. ✅ DNS configurado no Cloudflare
2. ✅ Wildcard subdomínios funcionando
3. ✅ SSL válido
4. ✅ Pronto para domínios personalizados
5. ✅ Aplicação multi-tenant funcional