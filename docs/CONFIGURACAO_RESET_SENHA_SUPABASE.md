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

## 🔒 Templates de Segurança (Security Notifications)

### 🔐 Template 7: "Password Changed" (Senha Alterada)

#### Subject:
```
Sua senha foi alterada - IMOBIDEPS
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
    .success-box { background: #d4edda; border-left: 4px solid #28a745; padding: 12px; margin: 20px 0; border-radius: 4px; color: #155724; }
    .danger-box { background: #f8d7da; border-left: 4px solid #dc3545; padding: 12px; margin: 20px 0; border-radius: 4px; color: #721c24; }
    .info-list { background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0; }
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
      <h2>Senha Alterada com Sucesso ✅</h2>
      <p>Olá,</p>
      
      <div class="success-box">
        <strong>✓ Confirmação de Alteração</strong>
        <p style="margin: 8px 0 0 0;">A senha da sua conta no <strong>IMOBIDEPS</strong> foi alterada com sucesso.</p>
      </div>
      
      <div class="info-list">
        <p><strong>Detalhes da alteração:</strong></p>
        <ul style="margin: 5px 0;">
          <li><strong>Data/Hora:</strong> {{ .DateTime }}</li>
          <li><strong>Dispositivo:</strong> {{ .UserAgent }}</li>
          <li><strong>IP:</strong> {{ .IPAddress }}</li>
        </ul>
      </div>
      
      <p>Se você realizou esta alteração, nenhuma ação adicional é necessária. Sua conta está segura.</p>
      
      <div class="danger-box">
        <strong>⚠️ Você NÃO alterou sua senha?</strong>
        <p style="margin: 8px 0 0 0;">Se você não reconhece esta alteração, sua conta pode estar comprometida. Tome as seguintes ações imediatamente:</p>
        <ol style="margin: 8px 0;">
          <li>Redefina sua senha imediatamente</li>
          <li>Revise as atividades recentes da sua conta</li>
          <li>Entre em contato com nosso suporte</li>
        </ol>
      </div>
      
      <div style="text-align: center;">
        <a href="https://painel.adminimobiliaria.site/forgot-password" class="button">Redefinir Senha</a>
      </div>
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

---

### 📧 Template 8: "Email Address Changed" (Email Alterado)

#### Subject:
```
Seu email foi alterado - IMOBIDEPS
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
    .success-box { background: #d4edda; border-left: 4px solid #28a745; padding: 12px; margin: 20px 0; border-radius: 4px; color: #155724; }
    .danger-box { background: #f8d7da; border-left: 4px solid #dc3545; padding: 12px; margin: 20px 0; border-radius: 4px; color: #721c24; }
    .info-list { background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0; }
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
      <h2>Email da Conta Alterado 📧</h2>
      <p>Olá,</p>
      
      <div class="success-box">
        <strong>✓ Email Atualizado</strong>
        <p style="margin: 8px 0 0 0;">O endereço de email da sua conta no <strong>IMOBIDEPS</strong> foi alterado com sucesso.</p>
      </div>
      
      <div class="info-list">
        <p><strong>Detalhes da alteração:</strong></p>
        <ul style="margin: 5px 0;">
          <li><strong>Novo email:</strong> {{ .NewEmail }}</li>
          <li><strong>Data/Hora:</strong> {{ .DateTime }}</li>
          <li><strong>Dispositivo:</strong> {{ .UserAgent }}</li>
        </ul>
      </div>
      
      <p><strong>Importante:</strong> A partir de agora, utilize o novo email para fazer login na sua conta.</p>
      
      <div class="danger-box">
        <strong>⚠️ Você NÃO solicitou esta alteração?</strong>
        <p style="margin: 8px 0 0 0;">Se você não reconhece esta alteração, sua conta pode estar em risco:</p>
        <ol style="margin: 8px 0;">
          <li>Entre em contato com nosso suporte imediatamente</li>
          <li>Tente fazer login com seu email antigo</li>
          <li>Redefina sua senha por segurança</li>
        </ol>
      </div>
      
      <div style="text-align: center;">
        <a href="https://painel.adminimobiliaria.site/dashboard" class="button">Acessar Painel</a>
      </div>
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

---

### 📱 Template 9: "Phone Number Changed" (Telefone Alterado)

#### Subject:
```
Seu telefone foi atualizado - IMOBIDEPS
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
    .success-box { background: #d4edda; border-left: 4px solid #28a745; padding: 12px; margin: 20px 0; border-radius: 4px; color: #155724; }
    .info-box { background: #d1ecf1; border-left: 4px solid #17a2b8; padding: 12px; margin: 20px 0; border-radius: 4px; color: #0c5460; }
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
      <h2>Número de Telefone Atualizado 📱</h2>
      <p>Olá,</p>
      
      <div class="success-box">
        <strong>✓ Telefone Alterado</strong>
        <p style="margin: 8px 0 0 0;">O número de telefone associado à sua conta no <strong>IMOBIDEPS</strong> foi atualizado.</p>
      </div>
      
      <div class="info-box">
        <p><strong>Novo número cadastrado:</strong></p>
        <p style="font-size: 18px; font-weight: bold; margin: 10px 0;">{{ .PhoneNumber }}</p>
        <p style="margin: 5px 0; font-size: 14px;"><strong>Data:</strong> {{ .DateTime }}</p>
      </div>
      
      <p>Este número agora pode ser usado para:</p>
      <ul>
        <li>Recuperação de conta</li>
        <li>Autenticação de dois fatores (2FA)</li>
        <li>Notificações de segurança via SMS</li>
      </ul>
      
      <p style="color: #666; font-size: 14px;">Se você não realizou esta alteração, acesse seu painel e atualize suas configurações de segurança.</p>
      
      <div style="text-align: center;">
        <a href="https://painel.adminimobiliaria.site/dashboard/settings" class="button">Verificar Configurações</a>
      </div>
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

---

### 🔗 Template 10: "Identity Linked" (Identidade Vinculada)

#### Subject:
```
Nova forma de login adicionada - IMOBIDEPS
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
    .success-box { background: #d4edda; border-left: 4px solid #28a745; padding: 12px; margin: 20px 0; border-radius: 4px; color: #155724; }
    .provider-box { background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0; text-align: center; }
    .danger-box { background: #f8d7da; border-left: 4px solid #dc3545; padding: 12px; margin: 20px 0; border-radius: 4px; color: #721c24; }
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
      <h2>Nova Identidade Vinculada 🔗</h2>
      <p>Olá,</p>
      
      <div class="success-box">
        <strong>✓ Novo Método de Login Adicionado</strong>
        <p style="margin: 8px 0 0 0;">Uma nova identidade foi vinculada à sua conta no <strong>IMOBIDEPS</strong>.</p>
      </div>
      
      <div class="provider-box">
        <p style="margin: 0 0 10px 0; color: #666;">Provedor vinculado:</p>
        <p style="font-size: 20px; font-weight: bold; margin: 0; color: #667eea;">{{ .Provider }}</p>
        <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">{{ .DateTime }}</p>
      </div>
      
      <p>Agora você pode fazer login no IMOBIDEPS usando:</p>
      <ul>
        <li>Email e senha (método tradicional)</li>
        <li><strong>{{ .Provider }}</strong> (novo método)</li>
      </ul>
      
      <div class="danger-box">
        <strong>⚠️ Você NÃO vinculou esta conta?</strong>
        <p style="margin: 8px 0 0 0;">Se você não reconhece esta vinculação, acesse seu painel imediatamente e remova esta identidade das configurações de segurança.</p>
      </div>
      
      <div style="text-align: center;">
        <a href="https://painel.adminimobiliaria.site/dashboard/settings/security" class="button">Gerenciar Segurança</a>
      </div>
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

---

### ⛓️‍💥 Template 11: "Identity Unlinked" (Identidade Desvinculada)

#### Subject:
```
Método de login removido - IMOBIDEPS
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
    .warning-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 20px 0; border-radius: 4px; color: #856404; }
    .provider-box { background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0; text-align: center; }
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
      <h2>Identidade Desvinculada ⛓️‍💥</h2>
      <p>Olá,</p>
      
      <div class="warning-box">
        <strong>⚠️ Método de Login Removido</strong>
        <p style="margin: 8px 0 0 0;">Uma identidade foi desvinculada da sua conta no <strong>IMOBIDEPS</strong>.</p>
      </div>
      
      <div class="provider-box">
        <p style="margin: 0 0 10px 0; color: #666;">Provedor removido:</p>
        <p style="font-size: 20px; font-weight: bold; margin: 0; color: #856404;">{{ .Provider }}</p>
        <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">{{ .DateTime }}</p>
      </div>
      
      <p><strong>Atenção:</strong> Você não poderá mais fazer login usando <strong>{{ .Provider }}</strong>.</p>
      
      <p>Certifique-se de que você ainda tem acesso à sua conta através de:</p>
      <ul>
        <li>Email e senha</li>
        <li>Outros provedores vinculados (se houver)</li>
      </ul>
      
      <p style="background: #e7f3ff; padding: 10px; border-radius: 4px; font-size: 14px;">
        <strong>💡 Dica:</strong> Se você removeu todos os métodos de login por engano, entre em contato com nosso suporte imediatamente.
      </p>
      
      <div style="text-align: center;">
        <a href="https://painel.adminimobiliaria.site/dashboard/settings/security" class="button">Gerenciar Segurança</a>
      </div>
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

---

### 🔐 Template 12: "MFA Method Added" (MFA Adicionado)

#### Subject:
```
Autenticação de dois fatores ativada - IMOBIDEPS
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
    .success-box { background: #d4edda; border-left: 4px solid #28a745; padding: 12px; margin: 20px 0; border-radius: 4px; color: #155724; }
    .mfa-box { background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0; text-align: center; }
    .security-tips { background: #e7f3ff; padding: 15px; border-radius: 6px; margin: 20px 0; }
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
      <h2>Autenticação de Dois Fatores Ativada! 🔐</h2>
      <p>Olá,</p>
      
      <div class="success-box">
        <strong>✓ Sua conta está mais segura!</strong>
        <p style="margin: 8px 0 0 0;">Um novo método de autenticação de dois fatores (2FA) foi adicionado à sua conta no <strong>IMOBIDEPS</strong>.</p>
      </div>
      
      <div class="mfa-box">
        <p style="margin: 0 0 10px 0; color: #666;">Método de 2FA adicionado:</p>
        <p style="font-size: 20px; font-weight: bold; margin: 0; color: #28a745;">{{ .MFAMethod }}</p>
        <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">Ativado em: {{ .DateTime }}</p>
      </div>
      
      <p><strong>O que isso significa?</strong></p>
      <p>A partir de agora, ao fazer login você precisará fornecer:</p>
      <ol>
        <li>Sua senha</li>
        <li>Um código de verificação adicional</li>
      </ol>
      
      <div class="security-tips">
        <strong>🛡️ Dicas de Segurança:</strong>
        <ul style="margin: 10px 0; text-align: left;">
          <li>Mantenha seu dispositivo 2FA em local seguro</li>
          <li>Guarde os códigos de backup em lugar seguro</li>
          <li>Não compartilhe códigos de verificação com ninguém</li>
        </ul>
      </div>
      
      <p style="color: #d32f2f; font-weight: bold; font-size: 14px;">Se você NÃO ativou a autenticação de dois fatores, acesse seu painel imediatamente e desative este método!</p>
      
      <div style="text-align: center;">
        <a href="https://painel.adminimobiliaria.site/dashboard/settings/security" class="button">Gerenciar 2FA</a>
      </div>
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

---

### 🔓 Template 13: "MFA Method Removed" (MFA Removido)

#### Subject:
```
Autenticação de dois fatores desativada - IMOBIDEPS
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
    .warning-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 20px 0; border-radius: 4px; color: #856404; }
    .danger-box { background: #f8d7da; border-left: 4px solid #dc3545; padding: 12px; margin: 20px 0; border-radius: 4px; color: #721c24; }
    .mfa-box { background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0; text-align: center; }
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
      <h2>Autenticação de Dois Fatores Removida 🔓</h2>
      <p>Olá,</p>
      
      <div class="warning-box">
        <strong>⚠️ Nível de Segurança Reduzido</strong>
        <p style="margin: 8px 0 0 0;">Um método de autenticação de dois fatores (2FA) foi removido da sua conta no <strong>IMOBIDEPS</strong>.</p>
      </div>
      
      <div class="mfa-box">
        <p style="margin: 0 0 10px 0; color: #666;">Método de 2FA removido:</p>
        <p style="font-size: 20px; font-weight: bold; margin: 0; color: #dc3545;">{{ .MFAMethod }}</p>
        <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">Removido em: {{ .DateTime }}</p>
      </div>
      
      <p><strong>O que mudou?</strong></p>
      <p>Agora, ao fazer login, você precisará apenas de sua senha (sem código adicional de verificação).</p>
      
      <div class="danger-box">
        <strong>🚨 Importante para sua Segurança:</strong>
        <ul style="margin: 10px 0;">
          <li>Sua conta está menos protegida sem 2FA</li>
          <li>Recomendamos fortemente reativar a autenticação de dois fatores</li>
          <li>Use uma senha forte e única</li>
        </ul>
      </div>
      
      <p style="color: #d32f2f; font-weight: bold;">Se você NÃO removeu a autenticação de dois fatores, sua conta pode estar comprometida! Reative o 2FA imediatamente e altere sua senha.</p>
      
      <div style="text-align: center;">
        <a href="https://painel.adminimobiliaria.site/dashboard/settings/security" class="button">Reativar 2FA</a>
      </div>
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

---

## 📝 3. Resumo das Redirect URLs por Template

### Templates de Autenticação:
| Template | Redirect URL |
|----------|-------------|
| **Confirm Signup** | `https://painel.adminimobiliaria.site/auth` |
| **Invite User** | `https://painel.adminimobiliaria.site/auth` |
| **Magic Link** | `https://painel.adminimobiliaria.site/dashboard` |
| **Change Email** | `https://painel.adminimobiliaria.site/dashboard` |
| **Reset Password** | `https://painel.adminimobiliaria.site/reset-password` |
| **Reauthentication** | `https://painel.adminimobiliaria.site/dashboard` |

### Templates de Segurança (Apenas notificação - sem redirect):
| Template | Tipo |
|----------|------|
| **Password Changed** | Notificação |
| **Email Address Changed** | Notificação |
| **Phone Number Changed** | Notificação |
| **Identity Linked** | Notificação |
| **Identity Unlinked** | Notificação |
| **MFA Method Added** | Notificação |
| **MFA Method Removed** | Notificação |

> **Nota:** Os templates de segurança são apenas informativos e não requerem confirmação via URL.

---

## 🌐 4. Configuração de CORS

### ⚠️ Importante: Onde configurar CORS

O **Supabase** gerencia CORS automaticamente através das **Redirect URLs** configuradas na seção de autenticação (Passo 1 deste guia). Não é necessário configurar CORS no Supabase para autenticação.

### 📍 CORS no Digital Ocean (Apps Platform)

Se você está usando **Digital Ocean Apps Platform**, configure CORS nas configurações da sua aplicação:

**Digital Ocean Dashboard** → Sua App → **Settings** → **CORS**

#### Access-Control-Allow-Origins:
```
http://localhost:5173
http://localhost:3000
https://adminimobiliaria.site
https://www.adminimobiliaria.site
https://painel.adminimobiliaria.site
https://*.adminimobiliaria.site
```

#### Access-Control-Allow-Methods:
```
GET, POST, PUT, DELETE, OPTIONS, PATCH
```

#### Access-Control-Allow-Headers:
```
Authorization, Content-Type, Accept, X-Requested-With
```

#### Access-Control-Allow-Credentials:
```
true
```

#### Access-Control-Max-Age:
```
86400
```

### 📌 Resumo:

✅ **Supabase:** Gerencia CORS automaticamente (apenas configure Redirect URLs)  
✅ **Digital Ocean:** Configure CORS nas settings da sua app (se necessário para sua API)  
✅ **Frontend → Supabase:** Funciona automaticamente com as Redirect URLs  
✅ **Frontend → Sua API no DO:** Precisa do CORS configurado no DO  

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
