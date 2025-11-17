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

---

### 🔐 Template 1: "Confirm Signup" (Confirmar Cadastro)

#### Subject:
```
Confirme seu cadastro - IMOBIDEPS
```

#### Body (HTML):
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center; }
    .header img { max-width: 150px; height: auto; margin-bottom: 10px; }
    .header h1 { color: #ffffff; margin: 10px 0 5px 0; font-size: 24px; }
    .header p { color: #e0e7ff; margin: 0; font-size: 14px; }
    .content { padding: 30px 20px; }
    .content h2 { color: #667eea; margin-top: 0; }
    .button { display: inline-block; padding: 14px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
    .button:hover { opacity: 0.9; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #e9ecef; }
    .alert { background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 20px 0; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://demcjskpwcxqohzlyjxb.supabase.co/storage/v1/object/public/logotipo%20saas/Design%20sem%20nome.png" alt="IMOBIDEPS">
      <h1>IMOBIDEPS</h1>
      <p>Sistema para Imobiliárias</p>
    </div>
    
    <div class="content">
      <h2>Bem-vindo ao IMOBIDEPS! 🎉</h2>
      <p>Olá,</p>
      <p>Obrigado por se cadastrar no <strong>IMOBIDEPS - Sistema para Imobiliárias</strong>!</p>
      <p>Para concluir seu cadastro e ativar sua conta, por favor confirme seu endereço de email clicando no botão abaixo:</p>
      
      <div style="text-align: center;">
        <a href="{{ .ConfirmationURL }}" class="button">Confirmar Email</a>
      </div>
      
      <div class="alert">
        <strong>⚠️ Importante:</strong> Este link é válido por 24 horas e só pode ser usado uma vez.
      </div>
      
      <p>Se você não criou uma conta no IMOBIDEPS, por favor ignore este email.</p>
    </div>
    
    <div class="footer">
      <p><strong>IMOBIDEPS - Sistema para Imobiliárias</strong></p>
      <p>Transformando a gestão de imóveis com tecnologia</p>
      <p style="margin-top: 10px; color: #999;">Este é um email automático, por favor não responda.</p>
    </div>
  </div>
</body>
</html>
```

#### Redirect URL:
```
https://painel.adminimobiliaria.site/auth
```

---

### 👥 Template 2: "Invite User" (Convidar Usuário)

#### Subject:
```
Você foi convidado para o IMOBIDEPS!
```

#### Body (HTML):
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center; }
    .header img { max-width: 150px; height: auto; margin-bottom: 10px; }
    .header h1 { color: #ffffff; margin: 10px 0 5px 0; font-size: 24px; }
    .header p { color: #e0e7ff; margin: 0; font-size: 14px; }
    .content { padding: 30px 20px; }
    .content h2 { color: #667eea; margin-top: 0; }
    .button { display: inline-block; padding: 14px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
    .button:hover { opacity: 0.9; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #e9ecef; }
    .features { background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0; }
    .features ul { margin: 10px 0; padding-left: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://demcjskpwcxqohzlyjxb.supabase.co/storage/v1/object/public/logotipo%20saas/Design%20sem%20nome.png" alt="IMOBIDEPS">
      <h1>IMOBIDEPS</h1>
      <p>Sistema para Imobiliárias</p>
    </div>
    
    <div class="content">
      <h2>Você recebeu um convite! 🎊</h2>
      <p>Olá,</p>
      <p>Você foi convidado para fazer parte do <strong>IMOBIDEPS - Sistema para Imobiliárias</strong>!</p>
      
      <div class="features">
        <p><strong>Com o IMOBIDEPS você pode:</strong></p>
        <ul>
          <li>Gerenciar seu catálogo de imóveis</li>
          <li>Site público personalizado para sua imobiliária</li>
          <li>Painel administrativo completo</li>
          <li>E muito mais!</li>
        </ul>
      </div>
      
      <p>Clique no botão abaixo para aceitar o convite e criar sua conta:</p>
      
      <div style="text-align: center;">
        <a href="{{ .ConfirmationURL }}" class="button">Aceitar Convite</a>
      </div>
      
      <p style="color: #666; font-size: 14px;">Se você não esperava este convite, pode ignorar este email com segurança.</p>
    </div>
    
    <div class="footer">
      <p><strong>IMOBIDEPS - Sistema para Imobiliárias</strong></p>
      <p>Transformando a gestão de imóveis com tecnologia</p>
      <p style="margin-top: 10px; color: #999;">Este é um email automático, por favor não responda.</p>
    </div>
  </div>
</body>
</html>
```

#### Redirect URL:
```
https://painel.adminimobiliaria.site/auth
```

---

### ✨ Template 3: "Magic Link" (Link Mágico)

#### Subject:
```
Seu link de acesso - IMOBIDEPS
```

#### Body (HTML):
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center; }
    .header img { max-width: 150px; height: auto; margin-bottom: 10px; }
    .header h1 { color: #ffffff; margin: 10px 0 5px 0; font-size: 24px; }
    .header p { color: #e0e7ff; margin: 0; font-size: 14px; }
    .content { padding: 30px 20px; }
    .content h2 { color: #667eea; margin-top: 0; }
    .button { display: inline-block; padding: 14px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
    .button:hover { opacity: 0.9; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #e9ecef; }
    .security-note { background: #e7f3ff; border-left: 4px solid #2196F3; padding: 12px; margin: 20px 0; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://demcjskpwcxqohzlyjxb.supabase.co/storage/v1/object/public/logotipo%20saas/Design%20sem%20nome.png" alt="IMOBIDEPS">
      <h1>IMOBIDEPS</h1>
      <p>Sistema para Imobiliárias</p>
    </div>
    
    <div class="content">
      <h2>Seu Link de Acesso Rápido 🔐</h2>
      <p>Olá,</p>
      <p>Você solicitou um link de acesso sem senha para entrar no <strong>IMOBIDEPS</strong>.</p>
      <p>Clique no botão abaixo para fazer login automaticamente:</p>
      
      <div style="text-align: center;">
        <a href="{{ .ConfirmationURL }}" class="button">Acessar Painel</a>
      </div>
      
      <div class="security-note">
        <strong>🔒 Segurança:</strong>
        <ul style="margin: 5px 0; padding-left: 20px;">
          <li>Este link é de uso único</li>
          <li>Válido por 1 hora</li>
          <li>Acesso apenas de dispositivos confiáveis</li>
        </ul>
      </div>
      
      <p style="color: #666;">Se você não solicitou este link, ignore este email e sua conta permanecerá segura.</p>
    </div>
    
    <div class="footer">
      <p><strong>IMOBIDEPS - Sistema para Imobiliárias</strong></p>
      <p>Transformando a gestão de imóveis com tecnologia</p>
      <p style="margin-top: 10px; color: #999;">Este é um email automático, por favor não responda.</p>
    </div>
  </div>
</body>
</html>
```

#### Redirect URL:
```
https://painel.adminimobiliaria.site/dashboard
```

---

### 📧 Template 4: "Change Email Address" (Alterar Email)

#### Subject:
```
Confirme seu novo email - IMOBIDEPS
```

#### Body (HTML):
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center; }
    .header img { max-width: 150px; height: auto; margin-bottom: 10px; }
    .header h1 { color: #ffffff; margin: 10px 0 5px 0; font-size: 24px; }
    .header p { color: #e0e7ff; margin: 0; font-size: 14px; }
    .content { padding: 30px 20px; }
    .content h2 { color: #667eea; margin-top: 0; }
    .button { display: inline-block; padding: 14px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
    .button:hover { opacity: 0.9; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #e9ecef; }
    .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 20px 0; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://demcjskpwcxqohzlyjxb.supabase.co/storage/v1/object/public/logotipo%20saas/Design%20sem%20nome.png" alt="IMOBIDEPS">
      <h1>IMOBIDEPS</h1>
      <p>Sistema para Imobiliárias</p>
    </div>
    
    <div class="content">
      <h2>Confirme a Alteração do seu Email 📧</h2>
      <p>Olá,</p>
      <p>Foi solicitada uma alteração do endereço de email da sua conta no <strong>IMOBIDEPS</strong>.</p>
      <p>Para confirmar esta alteração e começar a usar este novo email, clique no botão abaixo:</p>
      
      <div style="text-align: center;">
        <a href="{{ .ConfirmationURL }}" class="button">Confirmar Novo Email</a>
      </div>
      
      <div class="warning">
        <strong>⚠️ Atenção:</strong> Após a confirmação, este será o novo email de acesso à sua conta. Certifique-se de que você solicitou esta alteração.
      </div>
      
      <p style="color: #d32f2f; font-weight: bold;">Se você NÃO solicitou esta alteração:</p>
      <ul>
        <li>NÃO clique no link acima</li>
        <li>Entre em contato conosco imediatamente</li>
        <li>Altere sua senha por precaução</li>
      </ul>
    </div>
    
    <div class="footer">
      <p><strong>IMOBIDEPS - Sistema para Imobiliárias</strong></p>
      <p>Transformando a gestão de imóveis com tecnologia</p>
      <p style="margin-top: 10px; color: #999;">Este é um email automático, por favor não responda.</p>
    </div>
  </div>
</body>
</html>
```

#### Redirect URL:
```
https://painel.adminimobiliaria.site/dashboard
```

---

### 🔑 Template 5: "Reset Password" (Redefinir Senha)

#### Subject:
```
Redefinir senha - IMOBIDEPS
```

#### Body (HTML):
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center; }
    .header img { max-width: 150px; height: auto; margin-bottom: 10px; }
    .header h1 { color: #ffffff; margin: 10px 0 5px 0; font-size: 24px; }
    .header p { color: #e0e7ff; margin: 0; font-size: 14px; }
    .content { padding: 30px 20px; }
    .content h2 { color: #667eea; margin-top: 0; }
    .button { display: inline-block; padding: 14px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
    .button:hover { opacity: 0.9; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #e9ecef; }
    .info-box { background: #e3f2fd; border-left: 4px solid #2196F3; padding: 12px; margin: 20px 0; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://demcjskpwcxqohzlyjxb.supabase.co/storage/v1/object/public/logotipo%20saas/Design%20sem%20nome.png" alt="IMOBIDEPS">
      <h1>IMOBIDEPS</h1>
      <p>Sistema para Imobiliárias</p>
    </div>
    
    <div class="content">
      <h2>Redefinir sua Senha 🔐</h2>
      <p>Olá,</p>
      <p>Você solicitou a redefinição de senha para sua conta no <strong>IMOBIDEPS - Sistema para Imobiliárias</strong>.</p>
      <p>Clique no botão abaixo para criar uma nova senha:</p>
      
      <div style="text-align: center;">
        <a href="{{ .ConfirmationURL }}" class="button">Redefinir Senha</a>
      </div>
      
      <div class="info-box">
        <strong>📋 Requisitos da nova senha:</strong>
        <ul style="margin: 5px 0; padding-left: 20px;">
          <li>Mínimo de 8 caracteres</li>
          <li>Pelo menos uma letra maiúscula</li>
          <li>Pelo menos uma letra minúscula</li>
          <li>Pelo menos um número</li>
        </ul>
      </div>
      
      <p style="color: #666; font-size: 14px;">
        <strong>Tempo de validade:</strong> Este link expira em 1 hora.<br>
        <strong>Uso único:</strong> O link só pode ser usado uma vez.
      </p>
      
      <p style="color: #d32f2f; font-weight: bold;">Se você NÃO solicitou esta redefinição, ignore este email. Sua senha atual permanecerá inalterada.</p>
    </div>
    
    <div class="footer">
      <p><strong>IMOBIDEPS - Sistema para Imobiliárias</strong></p>
      <p>Transformando a gestão de imóveis com tecnologia</p>
      <p style="margin-top: 10px; color: #999;">Este é um email automático, por favor não responda.</p>
    </div>
  </div>
</body>
</html>
```

#### Redirect URL:
```
https://painel.adminimobiliaria.site/reset-password
```

---

### 🛡️ Template 6: "Reauthentication" (Reautenticação)

#### Subject:
```
Confirmação de segurança - IMOBIDEPS
```

#### Body (HTML):
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center; }
    .header img { max-width: 150px; height: auto; margin-bottom: 10px; }
    .header h1 { color: #ffffff; margin: 10px 0 5px 0; font-size: 24px; }
    .header p { color: #e0e7ff; margin: 0; font-size: 14px; }
    .content { padding: 30px 20px; }
    .content h2 { color: #667eea; margin-top: 0; }
    .button { display: inline-block; padding: 14px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
    .button:hover { opacity: 0.9; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #e9ecef; }
    .security { background: #ffebee; border-left: 4px solid #f44336; padding: 12px; margin: 20px 0; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://demcjskpwcxqohzlyjxb.supabase.co/storage/v1/object/public/logotipo%20saas/Design%20sem%20nome.png" alt="IMOBIDEPS">
      <h1>IMOBIDEPS</h1>
      <p>Sistema para Imobiliárias</p>
    </div>
    
    <div class="content">
      <h2>Confirmação de Segurança Necessária 🛡️</h2>
      <p>Olá,</p>
      <p>Por motivos de segurança, precisamos que você confirme sua identidade antes de realizar uma ação sensível na sua conta do <strong>IMOBIDEPS</strong>.</p>
      
      <div class="security">
        <strong>🔒 Ação que requer confirmação:</strong>
        <p style="margin: 8px 0;">Você está tentando realizar uma operação que afeta a segurança ou configurações importantes da sua conta.</p>
      </div>
      
      <p>Clique no botão abaixo para confirmar sua identidade e continuar:</p>
      
      <div style="text-align: center;">
        <a href="{{ .ConfirmationURL }}" class="button">Confirmar Identidade</a>
      </div>
      
      <p style="color: #666; font-size: 14px;">
        <strong>Este link:</strong>
      </p>
      <ul style="color: #666; font-size: 14px;">
        <li>É válido por 10 minutos</li>
        <li>Só pode ser usado uma vez</li>
        <li>É específico para esta ação</li>
      </ul>
      
      <p style="color: #d32f2f; font-weight: bold;">Se você NÃO tentou realizar nenhuma ação sensível, não clique no link e altere sua senha imediatamente!</p>
    </div>
    
    <div class="footer">
      <p><strong>IMOBIDEPS - Sistema para Imobiliárias</strong></p>
      <p>Transformando a gestão de imóveis com tecnologia</p>
      <p style="margin-top: 10px; color: #999;">Este é um email automático, por favor não responda.</p>
    </div>
  </div>
</body>
</html>
```

#### Redirect URL:
```
https://painel.adminimobiliaria.site/dashboard
```

---

## 📝 3. Resumo das Redirect URLs por Template

| Template | Redirect URL |
|----------|-------------|
| **Confirm Signup** | `https://painel.adminimobiliaria.site/auth` |
| **Invite User** | `https://painel.adminimobiliaria.site/auth` |
| **Magic Link** | `https://painel.adminimobiliaria.site/dashboard` |
| **Change Email** | `https://painel.adminimobiliaria.site/dashboard` |
| **Reset Password** | `https://painel.adminimobiliaria.site/reset-password` |
| **Reauthentication** | `https://painel.adminimobiliaria.site/dashboard` |

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

### 🔐 Teste 1: Reset de Senha

1. **Solicitar reset de senha**
   - Acesse: `https://painel.adminimobiliaria.site/forgot-password`
   - Digite um email cadastrado
   - Clique em "Enviar Link de Recuperação"

2. **Verificar email**
   - Abra a caixa de entrada do email informado
   - Procure por email de "Redefinir senha - IMOBIDEPS"
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

### ✨ Teste 2: Magic Link (Opcional)

1. Configure o Magic Link no Supabase (Authentication → Providers → Email → Enable Magic Link)
2. Na tela de login, adicione opção "Login sem senha"
3. Digite email e solicite Magic Link
4. Verifique email com subject "Seu link de acesso - IMOBIDEPS"
5. Clique no link e verifique se faz login automaticamente

### 📧 Teste 3: Change Email (Quando implementado)

1. No painel, acesse configurações de perfil
2. Altere o email
3. Verifique inbox do novo email
4. Clique no link de confirmação
5. Email deve ser atualizado

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
