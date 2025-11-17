# Configuração Supabase - Reset de Senha

## 📋 Checklist de Configuração

Este guia detalha as configurações necessárias no Supabase Dashboard para ativar o sistema de reset de senha.

---

## 🔐 1. Configurar Redirect URLs

### Onde configurar:
**Supabase Dashboard** → Seu Projeto → **Authentication** → **URL Configuration**

### URLs a adicionar em "Redirect URLs":

```
https://painel.adminimobiliaria.site/reset-password
https://painel.adminimobiliaria.site/forgot-password
https://painel.adminimobiliaria.site/auth
https://www.adminimobiliaria.site/**
https://adminimobiliaria.site/**
https://*.adminimobiliaria.site/**
http://localhost:5173/**
http://localhost:3000/**
```

### Site URL (manter):
```
http://localhost:5173
```

---

## 📧 2. Configurar Email Templates

### Onde configurar:
**Supabase Dashboard** → Seu Projeto → **Authentication** → **Email Templates**

### Template: "Reset Password"

#### Subject:
```
Redefinir senha - AdminImobiliaria
```

#### Body (HTML):
```html
<h2>Redefinir sua senha</h2>
<p>Olá,</p>
<p>Você solicitou a redefinição de senha para sua conta no AdminImobiliaria.</p>
<p>Clique no link abaixo para criar uma nova senha:</p>
<p><a href="{{ .ConfirmationURL }}">Redefinir Senha</a></p>
<p>Se você não solicitou esta redefinição, ignore este email.</p>
<p>Este link expira em 1 hora.</p>
<br>
<p>Atenciosamente,<br>Equipe AdminImobiliaria</p>
```

#### Redirect URL:
```
https://painel.adminimobiliaria.site/reset-password
```

---

## 📝 3. Outras Templates de Email (Opcional)

### Template: "Confirm Signup"

#### Redirect URL:
```
https://painel.adminimobiliaria.site/auth
```

### Template: "Change Email Address"

#### Redirect URL:
```
https://painel.adminimobiliaria.site/dashboard
```

---

## 🌐 4. Configurar CORS (API Settings)

### Onde configurar:
**Supabase Dashboard** → Seu Projeto → **Settings** → **API** → **CORS Origins**

### Origins permitidas:
```
http://localhost:5173
http://localhost:3000
https://adminimobiliaria.site
https://www.adminimobiliaria.site
https://painel.adminimobiliaria.site
https://*.adminimobiliaria.site
```

---

## 🔧 5. Configurações Adicionais de Autenticação

### Onde configurar:
**Supabase Dashboard** → Seu Projeto → **Authentication** → **Providers** → **Email**

### Configurações recomendadas:

- ✅ **Enable Email Provider**: ON
- ✅ **Confirm email**: OFF (para ambiente de produção, considere ativar)
- ⏱️ **Email Rate Limit**: 3 emails por hora (padrão)
- ⏱️ **Password Reset Token Expiry**: 3600 segundos (1 hora)

---

## 📮 6. Provider de Email (Resend.com)

Você já tem o Resend.com configurado para emails de boas-vindas. O Supabase usa seu próprio SMTP por padrão para emails de autenticação.

### Opção 1: Usar SMTP padrão do Supabase (Recomendado)
- Nenhuma configuração adicional necessária
- Emails são enviados automaticamente

### Opção 2: Configurar SMTP Customizado com Resend

**Onde configurar:**
**Supabase Dashboard** → Seu Projeto → **Settings** → **Auth** → **SMTP Settings**

**Configurações Resend:**
```
SMTP Host: smtp.resend.com
SMTP Port: 465
SMTP User: resend
SMTP Password: [Sua RESEND_API_KEY]
Sender Email: noreply@adminimobiliaria.site
Sender Name: AdminImobiliaria
```

---

## ✅ 7. Testar o Fluxo Completo

### Passo a passo:

1. **Solicitar reset de senha**
   - Acesse: `https://painel.adminimobiliaria.site/forgot-password`
   - Digite um email cadastrado
   - Clique em "Enviar Link de Recuperação"

2. **Verificar email**
   - Abra a caixa de entrada do email informado
   - Procure por email de "Redefinir senha - AdminImobiliaria"
   - Verifique pasta de spam se não aparecer

3. **Redefinir senha**
   - Clique no link recebido
   - Deve abrir: `https://painel.adminimobiliaria.site/reset-password?...`
   - Digite nova senha (mínimo 8 caracteres, maiúscula, minúscula, número)
   - Confirme a senha
   - Clique em "Redefinir Senha"

4. **Testar login**
   - Acesse: `https://painel.adminimobiliaria.site/auth`
   - Faça login com a nova senha
   - Deve redirecionar para `/dashboard`

---

## 🐛 Troubleshooting

### Email não chega

**Verificar:**
1. Email está correto e cadastrado no sistema?
2. Verificou pasta de spam/lixo eletrônico?
3. Redirect URLs estão configuradas corretamente?
4. SMTP está funcionando? (Check em Settings → Auth → SMTP Logs)

**Solução:**
- Verificar logs no Supabase Dashboard → Logs → Auth Logs
- Testar com outro email
- Verificar se domínio está na blacklist

### Link do email dá erro "Invalid session"

**Verificar:**
1. Link foi usado mais de uma vez?
2. Link expirou (> 1 hora)?
3. Token foi copiado incompleto?

**Solução:**
- Solicitar novo link de reset
- Verificar se redirect URL está correto no template

### Página de reset não aparece

**Verificar:**
1. Arquivo `/frontend/pages/reset-password.tsx` existe?
2. Build do frontend foi feito após criar o arquivo?
3. Redirect URL no template aponta para rota correta?

**Solução:**
```bash
cd /workspaces/danierickgithub/frontend
npm run build
npm run start
```

### Erro "Subscription not found" em planos

**Status:** ✅ CORRIGIDO

A API agora cria automaticamente uma assinatura trial se não existir quando o usuário acessa a página de planos.

---

## 📚 Referências

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Password Reset Guide](https://supabase.com/docs/guides/auth/auth-password-reset)
- [Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Resend SMTP Setup](https://resend.com/docs/send-with-smtp)

---

## 🎯 Status da Implementação

### ✅ Concluído:
- [x] Página `/forgot-password.tsx` criada
- [x] Página `/reset-password.tsx` criada
- [x] Link "Esqueceu sua senha?" adicionado em `/auth.tsx`
- [x] Link "Esqueceu sua senha?" adicionado em `AuthForm.tsx`
- [x] Função `resetPassword` já existe no `useAuth`
- [x] Validação de senha forte implementada
- [x] Correção do erro "Subscription not found" em planos

### ⚠️ Pendente (Configuração Manual):
- [ ] Configurar Redirect URLs no Supabase Dashboard
- [ ] Configurar Email Template "Reset Password"
- [ ] Testar fluxo completo de reset de senha
- [ ] (Opcional) Configurar SMTP customizado com Resend

---

## 🚀 Próximos Passos

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Entre no projeto `demcjskpwcxqohzlyjxb`
3. Siga as etapas 1 e 2 deste guia
4. Teste o fluxo completo (etapa 7)
5. ✅ Sistema de reset de senha estará funcionando!
