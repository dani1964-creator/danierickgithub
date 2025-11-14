# Sistema de Notificações - Instruções de Aplicação

## 📋 Resumo

Sistema completo de notificações em tempo real para imobiliárias, com sino no header do painel e notificações automáticas quando:
- ✅ Admin atualizar status de sugestão
- ✨ Nova atualização do sistema for publicada
- 🔄 Mudanças de prioridade em sugestões

## 🗄️ Passo 1: Aplicar SQL no Supabase

1. Acesse o **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Abra o arquivo `/supabase/sql/APLICAR_NOTIFICATIONS_SYSTEM.sql`
4. Copie todo o conteúdo
5. Cole no SQL Editor e execute

### O que o SQL cria:

```sql
✅ Tabela: broker_notifications
  - id, broker_id, suggestion_id, update_id
  - title, message, type
  - is_read, read_at, created_at

✅ Índices para performance:
  - idx_broker_notifications_broker_id
  - idx_broker_notifications_is_read
  - idx_broker_notifications_created_at

✅ RLS Policies:
  - Brokers veem apenas suas notificações
  - Brokers podem marcar como lidas
  - Super admin pode criar notificações

✅ Funções RPC:
  - mark_notification_as_read(notification_id)
  - mark_all_notifications_as_read()
  - get_unread_notifications_count()

✅ Triggers automáticos:
  - trigger_notify_on_suggestion_update
    → Cria notificação quando admin muda status de sugestão
  - trigger_notify_on_new_update
    → Notifica todos brokers ativos quando publicar update
```

## 🎨 Passo 2: Componentes Criados

### 1. NotificationBell Component
**Arquivo:** `/frontend/components/dashboard/NotificationBell.tsx`

Recursos:
- 🔔 Sino com badge de contagem
- 📱 Popover responsivo
- ⏱️ Tempo relativo ("5min atrás", "2h atrás")
- ✅ Marcar individual ou todas como lidas
- 🎯 Click navega para página relevante
- 🔄 Atualização em tempo real via Supabase Realtime

### 2. DashboardLayout atualizado
**Arquivo:** `/frontend/components/dashboard/DashboardLayout.tsx`

Alteração:
```tsx
// Adicionado no header entre o título e botão "Sair"
<NotificationBell />
```

## 🚀 Comportamento do Sistema

### Notificações Automáticas:

1. **Sugestão Atualizada** (`suggestion_update`):
   - Trigger: Admin altera status de sugestão
   - Destinatário: Broker que criou a sugestão
   - Exemplo: "A sugestão 'Filtro avançado' está agora: Em Análise"

2. **Sugestão Concluída** (`suggestion_completed`):
   - Trigger: Admin marca sugestão como "completed"
   - Destinatário: Broker que criou a sugestão
   - Exemplo: "A sugestão 'Modo escuro' está agora: Concluído"
   - Ícone: ✅

3. **Nova Atualização** (`new_system_update`):
   - Trigger: Admin publica nova atualização do sistema
   - Destinatário: TODOS os brokers ativos
   - Exemplo: "Nova funcionalidade de relatórios"
   - Ícone: ✨

### Ícones por Tipo:
- ✅ `suggestion_completed` - Concluído
- 🔄 `suggestion_update` - Atualizado
- ✨ `new_system_update` - Nova feature

## 📱 Interface do Usuário

### Sino de Notificação:
```
┌─────────────┐
│ 🔔 (9+)     │  ← Badge vermelho com contagem
└─────────────┘
```

### Popover (ao clicar):
```
┌────────────────────────────────┐
│ Notificações  [Marcar todas]   │
├────────────────────────────────┤
│ ✨ Nova atualização disponível │
│    Sistema de relatórios       │
│    5min atrás              ●   │ ← Bolinha = não lida
├────────────────────────────────┤
│ 🔄 Sua sugestão foi atualizada │
│    "Filtro avançado"           │
│    Em Análise                  │
│    2h atrás                    │
└────────────────────────────────┘
```

## 🔐 Segurança (RLS)

- ✅ Broker vê apenas **suas próprias** notificações
- ✅ Broker pode **marcar como lida** apenas suas notificações
- ✅ Super admin pode **criar** notificações para qualquer broker
- ✅ Ninguém pode **deletar** notificações (histórico preservado)

## 🧪 Testes

### 1. Testar notificação de sugestão:
1. Entre como imobiliária
2. Crie uma sugestão em `/dashboard/updates`
3. Entre como super admin em `/admin/updates`
4. Altere o status da sugestão
5. Volte para conta da imobiliária
6. ✅ Deve aparecer sino vermelho com (1)

### 2. Testar notificação de update:
1. Entre como super admin
2. Crie e publique uma atualização
3. Entre como imobiliária
4. ✅ Deve aparecer notificação "Nova atualização disponível"

### 3. Testar tempo real:
1. Abra 2 navegadores (ou aba anônima)
2. Entre como imobiliária em um
3. Entre como admin no outro
4. Admin atualiza sugestão
5. ✅ Notificação deve aparecer **instantaneamente** sem refresh

## 📊 Queries Úteis

### Ver todas as notificações de um broker:
```sql
SELECT * FROM broker_notifications
WHERE broker_id = '<BROKER_ID>'
ORDER BY created_at DESC;
```

### Contar não lidas:
```sql
SELECT COUNT(*) FROM broker_notifications
WHERE broker_id = '<BROKER_ID>'
AND is_read = false;
```

### Marcar todas como lidas (RPC):
```sql
SELECT mark_all_notifications_as_read();
```

## 🎯 Próximos Passos (Opcional)

### Melhorias futuras:
- [ ] Notificações por email
- [ ] Preferências de notificação (quais tipos receber)
- [ ] Som ao receber notificação
- [ ] Desktop notifications (browser API)
- [ ] Histórico com paginação infinita
- [ ] Filtros por tipo de notificação

## 📝 Notas Importantes

1. **Supabase Realtime** deve estar ativo no projeto
2. As notificações **não expiram** (histórico completo)
3. Badge mostra até **9+** (otimização visual)
4. Popover mostra últimas **20 notificações**
5. Click em notificação **navega** para página e **marca como lida**

---

✅ **Sistema pronto para uso!** Aplique o SQL e teste.
