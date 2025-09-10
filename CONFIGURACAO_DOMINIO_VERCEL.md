# Configuração de Domínio Personalizado na Vercel

## Como Configurar Seu Domínio Personalizado

### 1. **No Painel da Vercel**

1. Acesse seu projeto na Vercel
2. Vá em **Settings** → **Domains**
3. Clique em **Add Domain**
4. Digite seu domínio (ex: `meusite.com.br`)
5. Siga as instruções de verificação DNS

### 2. **Configuração DNS no Seu Provedor**

Configure os seguintes registros DNS:

#### **Para domínio raiz (meusite.com.br):**
- **Tipo**: A Record
- **Nome**: @ (ou deixe em branco)
- **Valor**: 76.76.19.61 (IP da Vercel)

#### **Para subdomínio www:**
- **Tipo**: CNAME
- **Nome**: www
- **Valor**: cname.vercel-dns.com

### 3. **Configuração Automática SSL**

✅ A Vercel configurará automaticamente o certificado SSL  
✅ Isso pode levar algumas horas para propagar  
✅ Seu site ficará acessível via HTTPS automaticamente  

### 4. **Resultado Final**

Após a configuração:

#### **Site Público (Para Clientes):**
- `https://meusite.com.br` → Site público da imobiliária
- `https://meusite.com.br/casa-luxo-123` → Detalhes da propriedade

#### **Painel Administrativo (Para Corretores):**
- `https://meusite.com.br/auth` → Login do corretor
- `https://meusite.com.br/admin` → Super Admin (se aplicável)

### 5. **Vantagens do Domínio Personalizado**

✅ **URLs Profissionais**: Seus clientes veem seu domínio  
✅ **SEO Melhorado**: Google indexa com seu domínio  
✅ **Credibilidade**: Aparência mais profissional  
✅ **WhatsApp Otimizado**: Links limpos nos compartilhamentos  

### 6. **Verificação da Configuração**

Para verificar se está funcionando:

1. **Teste o DNS**: Use [DNSChecker.org](https://dnschecker.org) 
2. **Teste HTTPS**: Acesse `https://seudominio.com.br`
3. **Teste Redirecionamento**: Verifique se `www.seudominio.com.br` redireciona corretamente

### 7. **Solução de Problemas**

#### **Problema: "Domain not found" na Vercel**
- Verifique se os registros DNS estão corretos
- Aguarde até 48h para propagação completa

#### **Problema: SSL não funciona**
- Aguarde algumas horas após configurar DNS
- Verifique se não há registros DNS conflitantes

#### **Problema: Site não carrega**
- Confirme que o registro A aponta para `76.76.19.61`
- Verifique se não há outros registros A conflitantes

### 8. **Provedores de Domínio Populares**

#### **Registro.br** (Domínios .br)
1. Acesse o painel do Registro.br
2. Vá em "DNS" → "Alterar DNS"
3. Configure os registros A e CNAME conforme instruções

#### **GoDaddy**
1. Acesse o painel GoDaddy
2. Vá em "DNS Management"
3. Configure os registros conforme instruções

#### **Cloudflare**
1. Acesse o painel Cloudflare
2. Vá em "DNS"
3. Configure os registros (desative proxy se necessário)

---

## Suporte

Se precisar de ajuda com a configuração, verifique:
1. Documentação oficial da Vercel
2. Suporte do seu provedor de domínio
3. Ferramentas de diagnóstico DNS online