-- Exemplo: Criar notificação de teste manualmente
-- Execute isso no SQL Editor do Supabase para testar o sino

-- 1. Buscar ID de um broker ativo
SELECT id, business_name, email 
FROM brokers 
WHERE is_active = true 
LIMIT 1;

-- 2. Copie o ID do broker e use na query abaixo
-- Substitua '<BROKER_ID>' pelo ID real

INSERT INTO broker_notifications (
  broker_id,
    title,
      message,
        type
        ) VALUES (
          '<BROKER_ID>',  -- ← Substitua aqui
            'Teste de Notificação',
              'Esta é uma notificação de teste. O sistema está funcionando! 🎉',
                'new_system_update'
                );

                -- 3. Agora acesse o painel da imobiliária
                -- Você deve ver o sino vermelho com (1)

                -- 4. Para criar uma notificação de sugestão atualizada:
                INSERT INTO broker_notifications (
                  broker_id,
                    title,
                      message,
                        type
                        ) VALUES (
                          '<BROKER_ID>',
                            'Sua sugestão foi atualizada',
                              'A sugestão "Minha sugestão teste" está agora: Em Análise',
                                'suggestion_update'
                                );

                                -- 5. Para marcar todas como lidas (teste a função):
                                SELECT mark_all_notifications_as_read();

                                -- 6. Para verificar contagem de não lidas:
                                SELECT get_unread_notifications_count();
                                