# 🔍 DIAGNÓSTICO: Problema de Verificação de Domínio Personalizado

**Data:** 19 de novembro de 2025  
**Investigação:** Colunas broker.custom_domain vs broker.domain

---

## ✅ VERIFICAÇÕES REALIZADAS

### 1. Estrutura da Tabela `brokers`

**Colunas verificadas via API REST:**
```json
{
  "id": "uuid",
  "subdomain": "texto",           ✅ EXISTE
  "custom_domain": "texto",       ✅ EXISTE
  "business_name": "texto"
}
```

**Tentativa de acessar coluna `domain`:**
```
❌ ERRO: "column brokers.domain does not exist"
```

**Conclusão:** A coluna correta é `custom_domain`, NÃO `domain`.

---

### 2. Verificação dos Types TypeScript

**Arquivo:** `frontend/integrations/supabase/types.ts` (linha 87)
```typescript
brokers: {
  Row: {
    custom_domain: string | null  ✅ CORRETO
    subdomain: string | null      ✅ CORRETO
    // ... outras colunas
  }
}
```

**Conclusão:** Os types estão corretos usando `custom_domain`.

---

### 3. Verificação do Código Frontend

**Arquivo:** `frontend/pages/dashboard/website.tsx` (linha 108)
```typescript
const baseUpdate = {
  custom_domain: profile.custom_domain,  ✅ CORRETO
  // ...
}
```

**Conclusão:** O código está usando `custom_domain` corretamente.

---

### 4. Estado Atual do Banco de Dados

#### Brokers (5 registros verificados):
```
┌─────────────┬──────────────┬───────────────┐
│ business_name│ subdomain   │ custom_domain │
├─────────────┼──────────────┼───────────────┤
│ AugustusEmp │ teste-sync   │ NULL          │
│ imobi teste │ bucos        │ NULL          │
│ terceira im │ home         │ NULL          │
│ Super Admin │ admin        │ NULL          │
│ Imobiliária │ deps         │ NULL          │
└─────────────┴──────────────┴───────────────┘
```

**Observação:** Nenhum broker tem `custom_domain` preenchido.

#### DNS Zones:
```
❌ TABELA VAZIA - Nenhuma zona DNS encontrada
```

**Observação crítica:** A zona `maisexpansaodeconsciencia.site` que existia anteriormente (com 45 tentativas de verificação) **FOI DELETADA**.

---

## 🔴 PROBLEMA IDENTIFICADO

### O problema NÃO é com nomes de colunas

✅ **Código usa `custom_domain` corretamente**  
✅ **Types TypeScript estão corretos**  
✅ **API REST funciona com `custom_domain`**  

### O problema REAL é:

🔴 **A zona DNS foi deletada do banco de dados**
- Anteriormente existia: `maisexpansaodeconsciencia.site` (status: verifying, 45 tentativas)
- Agora: Tabela `dns_zones` está completamente vazia
- Resultado: Sem zona DNS = Sem verificação possível

---

## 🎯 CAUSA RAIZ

Possíveis causas da deleção:

1. **Zona deletada manualmente no Supabase SQL Editor**
2. **Zona deletada via API do sistema** (improvável sem ação do usuário)
3. **Trigger ou função automática deletou** (não há triggers de auto-deleção)
4. **Zona nunca foi realmente salva** após a criação inicial

---

## 🔧 SOLUÇÃO

Para testar o sistema novamente, é necessário:

### 1. Recriar a zona DNS
Acesse o dashboard → Aba "Domínio" → Digite o domínio → "Configurar Domínio"

Isso vai:
- ✅ Criar zona no Digital Ocean
- ✅ Salvar no banco `dns_zones`
- ✅ Retornar nameservers para configurar no GoDaddy

### 2. Verificar se a zona persiste
Execute após criar:
```bash
curl -s 'https://demcjskpwcxqohzlyjxb.supabase.co/rest/v1/dns_zones?select=*' \
  -H "apikey: TOKEN" | jq .
```

### 3. Garantir que nameservers estão configurados
No GoDaddy, os nameservers devem estar:
- ns1.digitalocean.com
- ns2.digitalocean.com
- ns3.digitalocean.com

### 4. Aguardar propagação
- Tempo: 5 minutos a 48 horas
- Cron job verifica automaticamente a cada 5 minutos
- Status muda de `verifying` para `active` quando pronto

---

## 📋 CHECKLIST DE VERIFICAÇÃO

Para garantir que tudo está funcionando:

- [ ] Zona DNS existe na tabela `dns_zones`
- [ ] Zona tem `broker_id` correto
- [ ] Status é `verifying` ou `active`
- [ ] Nameservers estão preenchidos (array com 3 itens)
- [ ] Nameservers configurados no GoDaddy
- [ ] Cron job está rodando (verificar logs)
- [ ] Após ativação, `custom_domain` é preenchido automaticamente via trigger

---

## 🚨 RECOMENDAÇÃO

**Não há problema com nomes de colunas.** O sistema está usando `custom_domain` corretamente em todo o código.

**O problema é que a zona DNS foi deletada.** Basta recriar via interface do SaaS e aguardar a verificação automática.

Se após recriar a zona ela for deletada novamente, verificar:
1. Logs da aplicação para ver quem/o que está deletando
2. RLS policies na tabela `dns_zones`
3. Triggers ou funções que possam estar deletando automaticamente
