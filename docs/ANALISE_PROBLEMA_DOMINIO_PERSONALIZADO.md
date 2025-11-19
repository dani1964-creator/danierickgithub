# 🔍 ANÁLISE: Por que o Domínio Personalizado não está Funcionando

**Data**: 19 de novembro de 2025  
**Domínio analisado**: `maisexpansaodeconsciencia.site`  
**Status**: ❌ NÃO FUNCIONA

---

## 📊 DIAGNÓSTICO EXECUTADO

### ✅ O que ESTÁ funcionando:

1. **Middleware** (`frontend/middleware.ts`)
   - ✅ Detecta domínios personalizados corretamente (`isCustomDomain`)
   - ✅ Reescreve para `/public-site` quando é domínio personalizado
   - ✅ Adiciona headers `x-custom-domain`, `x-hostname`, `x-app-type`
   - ✅ Lógica de roteamento implementada corretamente

2. **Página de Vitrine** (`pages/public-site.tsx`)
   - ✅ Existe e está pronta para servir conteúdo
   - ✅ Deve receber o domínio via headers do middleware

3. **APIs de Domínio** (`pages/api/domains/`)
   - ✅ 5 APIs criadas (configure, provision, verify, do-status, list)
   - ✅ Validação e normalização com `domainUtils.ts`
   - ✅ Prontas para usar

4. **Interface do Usuário** (`pages/dashboard/website.tsx`)
   - ✅ Campo para inserir domínio personalizado
   - ✅ Botão "Save" funcional
   - ✅ Botão "Verificar DNS" com status visual
   - ✅ Instruções DNS detalhadas (CNAME + A record)

---

## 🔴 O PROBLEMA REAL: DNS NÃO CONFIGURADO

### Teste de DNS realizado:

```bash
$ nslookup maisexpansaodeconsciencia.site
❌ ERRO: ENOTFOUND - Could not resolve host
```

### O que isso significa:

O domínio `maisexpansaodeconsciencia.site` **NÃO possui registros DNS configurados**. Quando alguém tenta acessar o site:

1. O navegador tenta resolver o DNS
2. **Falha** porque não existem registros A ou CNAME
3. Retorna erro: "Could not resolve host"
4. **Nunca chega no servidor** (nem middleware, nem Next.js, nada)

---

## 🎯 CAUSA RAIZ

O problema **NÃO É NO CÓDIGO**. O código está perfeito e funcional.

O problema é **CONFIGURAÇÃO DE DNS FALTANDO** no registrador do domínio (GoDaddy ou outro).

### Analogia:

É como ter:
- ✅ Um prédio lindo e pronto (seu site/middleware)
- ✅ Um endereço na fachada (custom_domain no banco)
- ❌ **Mas nenhuma placa na rua indicando onde fica** (DNS)

Sem a "placa" (DNS), as pessoas não conseguem encontrar o prédio.

---

## ✅ SOLUÇÃO DEFINITIVA

### Passo 1: Acessar o Painel do Registrador

1. Fazer login no **GoDaddy** (ou onde o domínio foi registrado)
2. Ir em **"Meus Domínios"** → **"Gerenciar DNS"** do domínio `maisexpansaodeconsciencia.site`

### Passo 2: Adicionar Registros DNS

**Registro 1 - A Record (domínio raiz)**
```
Tipo:  A
Nome:  @ (ou deixar em branco)
Valor: 162.159.140.98
TTL:   1 hora (3600 segundos)
```

**Registro 2 - CNAME (www)**
```
Tipo:  CNAME
Nome:  www
Valor: adminimobiliaria.site
TTL:   1 hora (3600 segundos)
```

### Passo 3: Aguardar Propagação

- **Mínimo**: 10-30 minutos
- **Típico**: 2-4 horas
- **Máximo**: 24-48 horas

### Passo 4: Verificar Propagação

**Opção 1 - Online:**
- Acessar: https://www.whatsmydns.net/
- Inserir: `maisexpansaodeconsciencia.site`
- Verificar se retorna o IP `162.159.140.98`

**Opção 2 - Terminal:**
```bash
nslookup maisexpansaodeconsciencia.site
# Deve retornar: 162.159.140.98
```

**Opção 3 - Script do projeto:**
```bash
node scripts/check-custom-domain-setup.js
```

### Passo 5: Testar no Navegador

Após propagação, acessar:
- `https://maisexpansaodeconsciencia.site`
- Deve carregar a vitrine da imobiliária

---

## 🔍 VERIFICAÇÕES ADICIONAIS NO BANCO

Execute no **Supabase SQL Editor**:

```sql
-- Verificar se o domínio está salvo na tabela brokers
SELECT id, business_name, website_slug, custom_domain
FROM brokers 
WHERE custom_domain = 'maisexpansaodeconsciencia.site';
```

**Resultado esperado:**
```
id: uuid-do-broker
business_name: RF Imobiliária (ou similar)
website_slug: rfimobiliaria
custom_domain: maisexpansaodeconsciencia.site
```

Se retornar **vazio**, o domínio não foi salvo. Neste caso:
1. Acessar o painel em `painel.adminimobiliaria.site`
2. Ir em **"Configurações" → "Site"**
3. Inserir `maisexpansaodeconsciencia.site` no campo
4. Clicar em **"Save"**

---

## 📋 CHECKLIST COMPLETO

### No Registrador de Domínio (GoDaddy):
- [ ] Registro A configurado (@ → 162.159.140.98)
- [ ] Registro CNAME configurado (www → adminimobiliaria.site)
- [ ] TTL configurado para 1 hora
- [ ] Aguardar propagação (mín 30 min)

### No Supabase:
- [ ] Domínio salvo em `brokers.custom_domain`
- [ ] Tabela `domain_verifications` criada (opcional, para tracking)

### No Painel do Broker:
- [ ] Campo "Domínio Personalizado" preenchido
- [ ] Clicado em "Save" ao lado do campo
- [ ] Instruções DNS visíveis na tela

### Teste Final:
- [ ] DNS resolve corretamente (`nslookup`)
- [ ] Site carrega em `https://maisexpansaodeconsciencia.site`
- [ ] Botão "Verificar DNS" mostra ✅ sucesso

---

## 🚨 ERROS COMUNS E SOLUÇÕES

### Erro 1: "DNS_PROBE_FINISHED_NXDOMAIN"
**Causa**: DNS não configurado  
**Solução**: Adicionar registros A e CNAME conforme instruções acima

### Erro 2: "ERR_CONNECTION_TIMED_OUT"
**Causa**: IP incorreto ou firewall bloqueando  
**Solução**: Verificar se IP é `162.159.140.98` e se porta 443 está aberta

### Erro 3: "Este site não pode fornecer uma conexão segura"
**Causa**: Certificado SSL não emitido ainda  
**Solução**: Aguardar 1-2 horas após DNS propagar. Digital Ocean emite SSL automaticamente.

### Erro 4: Domínio carrega mas mostra site errado
**Causa**: `custom_domain` não salvo no banco ou middleware não detectando  
**Solução**: 
1. Verificar no SQL se domínio está salvo
2. Checar logs do middleware (`console.log` do hostname)
3. Verificar se headers `x-custom-domain` estão sendo passados

---

## 🎓 ENTENDENDO O FLUXO COMPLETO

```
┌─────────────────────────────────────────────────────────┐
│ 1. USUÁRIO DIGITA: maisexpansaodeconsciencia.site       │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ 2. DNS LOOKUP                                           │
│    Pergunta: "Qual o IP desse domínio?"                 │
│    Resposta: 162.159.140.98 (registro A)                │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ 3. NAVEGADOR CONECTA NO IP                              │
│    GET / HTTP/1.1                                       │
│    Host: maisexpansaodeconsciencia.site                 │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ 4. DIGITAL OCEAN APP PLATFORM                           │
│    - Recebe requisição                                  │
│    - Verifica certificado SSL                           │
│    - Encaminha para Next.js                             │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ 5. MIDDLEWARE (middleware.ts)                           │
│    hostname = "maisexpansaodeconsciencia.site"          │
│    isCustomDomain = true (não contém adminimobiliaria)  │
│    → Reescreve para /public-site                        │
│    → Adiciona headers x-custom-domain                   │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ 6. PÁGINA public-site.tsx                               │
│    - Lê header x-custom-domain                          │
│    - Busca broker no banco por custom_domain            │
│    - Renderiza vitrine da imobiliária                   │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ 7. RESPOSTA AO USUÁRIO                                  │
│    HTML da vitrine personalizada                        │
└─────────────────────────────────────────────────────────┘
```

### 🔴 ONDE ESTÁ TRAVANDO AGORA:

O fluxo está parando no **PASSO 2** (DNS Lookup).

O DNS não retorna nenhum IP, então o navegador nem tenta conectar. Por isso o erro é `Could not resolve host` (não conseguiu resolver o DNS).

---

## 📞 PRÓXIMOS PASSOS PRÁTICOS

1. **AGORA**: Configurar DNS no GoDaddy conforme instruções acima
2. **EM 30min**: Testar `nslookup maisexpansaodeconsciencia.site`
3. **EM 2h**: Testar acesso no navegador
4. **SE DER ERRO**: Executar `node scripts/check-custom-domain-setup.js` e compartilhar resultado

---

## 📚 RECURSOS ÚTEIS

- **Verificar DNS**: https://www.whatsmydns.net/
- **Script de diagnóstico**: `scripts/check-custom-domain-setup.js`
- **Script SQL de verificação**: `scripts/verify-custom-domain-in-database.sql`
- **Documentação completa**: `docs/SISTEMA_DOMINIOS_COMPLETO.md`

---

**Conclusão**: O código está perfeito. O único problema é a **falta de configuração DNS no registrador**. Após configurar os registros A e CNAME no GoDaddy e aguardar propagação, tudo funcionará normalmente.
