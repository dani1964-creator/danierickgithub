# 🔧 CONFIGURAÇÃO DIGITAL OCEAN - VARIÁVEIS DE AMBIENTE

## ⚠️ PROBLEMA IDENTIFICADO

O erro 500 no cadastro está acontecendo porque a variável `SUPABASE_SERVICE_ROLE_KEY` **não está configurada no Digital Ocean App Platform**.

## 📋 SOLUÇÃO: Configurar Variáveis de Ambiente no Digital Ocean

### Passo 1: Acessar Digital Ocean App Platform
1. Acesse https://cloud.digitalocean.com/apps
2. Clique na sua app (adminimobiliaria)
3. Vá em **Settings** → **App-Level Environment Variables**

### Passo 2: Adicionar/Verificar as Variáveis

Certifique-se de que **TODAS** essas variáveis estão configuradas:

#### 🔓 Variáveis Públicas (podem ser expostas ao cliente)
```
NEXT_PUBLIC_BASE_PUBLIC_DOMAIN=adminimobiliaria.site
NEXT_PUBLIC_APP_URL=https://adminimobiliaria.site
NEXT_PUBLIC_CNAME_TARGET=whale-app-w84mh.ondigitalocean.app
NEXT_PUBLIC_SUPABASE_URL=https://demcjskpwcxqohzlyjxb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlbWNqc2twd2N4cW9oemx5anhiIiwicm9zZSI6ImFub24iLCJpYXQiOjE3NTUwNDIxMzUsImV4cCI6MjA3MDYxODEzNX0.9p5j5yUKF-HAJCuo8A2BqNhB8JVV9Sgc2KdekRuR4Ww
```

#### 🔒 Variáveis Secretas (CRÍTICAS - Marcar como "Encrypt")
```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlbWNqc2twd2N4cW9oemx5anhiIiwicm9zZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTA0MjEzNSwiZXhwIjoyMDcwNjE4MTM1fQ.GiG1U1St1uueHjYdFPCiYB29jV1S3lFssrEnzswWYxM
```

**⚠️ IMPORTANTE:** A variável `SUPABASE_SERVICE_ROLE_KEY` é **OBRIGATÓRIA** para:
- ✅ Criar usuários na autenticação
- ✅ Inserir brokers na tabela
- ✅ Criar subscriptions
- ✅ Bypass de RLS policies

### Passo 3: Verificar se está configurada corretamente

No Digital Ocean, a variável deve aparecer assim:

```
Nome: SUPABASE_SERVICE_ROLE_KEY
Valor: eyJhbGci... (o token completo)
Tipo: Encrypted ✓
Scope: All components
```

### Passo 4: Fazer Deploy

Após adicionar/verificar as variáveis:
1. Clique em **Save**
2. O Digital Ocean vai fazer redeploy automaticamente
3. Aguarde o build completar (2-5 minutos)

### Passo 5: Testar

1. Acesse https://www.adminimobiliaria.site/cadastro
2. Preencha o formulário
3. Abra o Console (F12) para ver os logs
4. Clique em "Começar Teste Grátis"
5. Deve funcionar!

## 🔍 Como Verificar se a Variável Está Configurada

Você pode adicionar este endpoint temporário para testar:

**Arquivo:** `/frontend/pages/api/test-env.ts`
```typescript
import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  
  return res.status(200).json({
    hasServiceKey,
    hasUrl,
    serviceKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
  });
}
```

Acesse: `https://www.adminimobiliaria.site/api/test-env`

Resultado esperado:
```json
{
  "hasServiceKey": true,
  "hasUrl": true,
  "serviceKeyLength": 230
}
```

Se `hasServiceKey: false`, a variável **NÃO está configurada** no Digital Ocean!

## 📝 Notas Adicionais

- As variáveis do arquivo `.env.production` **NÃO são lidas automaticamente** no Digital Ocean
- Você precisa configurá-las manualmente no painel da App Platform
- Sempre marque chaves secretas como "Encrypted"
- Após qualquer mudança, é necessário fazer redeploy

## ✅ Checklist Final

- [ ] Variável `SUPABASE_SERVICE_ROLE_KEY` adicionada no Digital Ocean
- [ ] Variável marcada como "Encrypted"
- [ ] Redeploy completado com sucesso
- [ ] Teste de cadastro funcionando
- [ ] Console mostrando "✅ Broker criado com sucesso"
