-- Script de correção: Sincronizar trial_ends_at para brokers existentes
-- Execute este script APÓS aplicar a migration 20251116000001_sync_trial_functions.sql
-- Data: 2025-11-16

-- ========================================
-- PARTE 1: SINCRONIZAÇÃO
-- ========================================

-- 1. Sincronizar trial_ends_at dos brokers em trial com suas subscriptions
UPDATE public.brokers b
SET trial_ends_at = s.trial_end_date
FROM public.subscriptions s
WHERE b.id = s.broker_id
AND s.status = 'trial'
AND s.trial_end_date IS NOT NULL
AND (b.trial_ends_at IS NULL OR b.trial_ends_at <> s.trial_end_date);

-- Ver quantos foram atualizados
SELECT 
  COUNT(*) as brokers_sincronizados,
    'Brokers em trial sincronizados' as descricao
    FROM public.brokers b
    JOIN public.subscriptions s ON b.id = s.broker_id
    WHERE s.status = 'trial'
    AND b.trial_ends_at = s.trial_end_date;

    -- 2. Limpar trial_ends_at de brokers com assinatura ativa
    UPDATE public.brokers b
    SET trial_ends_at = NULL
    FROM public.subscriptions s
    WHERE b.id = s.broker_id
    AND s.status = 'active'
    AND b.trial_ends_at IS NOT NULL;

    -- 3. Marcar como expirado brokers cancelados
    UPDATE public.brokers b
    SET trial_ends_at = now() - INTERVAL '1 day'
    FROM public.subscriptions s
    WHERE b.id = s.broker_id
    AND s.status = 'cancelled'
    AND b.trial_ends_at IS NULL;

    -- ========================================
    -- PARTE 2: VERIFICAÇÃO
    -- ========================================

    -- 4. Verificar estado atual
    SELECT 
      'Trial Ativo' as status,
        COUNT(*) as quantidade
        FROM public.brokers
        WHERE trial_ends_at > now()

        UNION ALL

        SELECT 
          'Trial Expirado' as status,
            COUNT(*) as quantidade
            FROM public.brokers
            WHERE trial_ends_at <= now()

            UNION ALL

            SELECT 
              'Sem Trial (Ativo ou Nunca teve)' as status,
                COUNT(*) as quantidade
                FROM public.brokers
                WHERE trial_ends_at IS NULL;

                -- 5. Verificar se há dessincronização
                SELECT 
                  b.business_name,
                    b.email,
                      b.trial_ends_at as broker_trial,
                        s.trial_end_date as subscription_trial,
                          s.status,
                            CASE 
                                WHEN b.trial_ends_at <> s.trial_end_date THEN '⚠️ DESSINCRONIZADO'
                                    ELSE '✅ OK'
                                      END as sync_status
                                      FROM public.brokers b
                                      JOIN public.subscriptions s ON b.id = s.broker_id
                                      WHERE s.status = 'trial'
                                      ORDER BY sync_status DESC;

                                      -- ========================================
                                      -- PARTE 3: RELATÓRIO DETALHADO
                                      -- ========================================

                                      -- 6. Relatório completo de todos os trials
                                      SELECT 
                                        b.id,
                                          b.business_name,
                                            b.email,
                                              b.trial_ends_at,
                                                s.trial_end_date,
                                                  s.status as subscription_status,
                                                    EXTRACT(DAY FROM (b.trial_ends_at - now()))::INTEGER as days_remaining,
                                                      CASE 
                                                          WHEN b.trial_ends_at IS NULL THEN '❌ Sem trial_ends_at'
                                                              WHEN b.trial_ends_at < now() THEN '🔴 Expirado'
                                                                  WHEN b.trial_ends_at < now() + INTERVAL '3 days' THEN '🟡 Expirando em breve'
                                                                      WHEN b.trial_ends_at < now() + INTERVAL '7 days' THEN '🟢 Ativo (< 7 dias)'
                                                                          ELSE '✅ Ativo'
                                                                            END as status_visual
                                                                            FROM public.brokers b
                                                                            LEFT JOIN public.subscriptions s ON b.id = s.broker_id
                                                                            WHERE b.trial_ends_at IS NOT NULL OR s.status = 'trial'
                                                                            ORDER BY b.trial_ends_at NULLS LAST;

                                                                            -- ========================================
                                                                            -- FINALIZAÇÃO
                                                                            -- ========================================

                                                                            -- Mensagem de conclusão
                                                                            SELECT 
                                                                              '✅ Script executado com sucesso!' as resultado,
                                                                                'Verifique os relatórios acima para confirmar a sincronização' as proximo_passo;
                                                                                