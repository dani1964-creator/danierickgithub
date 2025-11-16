-- Migration: Sincronizar trial_ends_at com funções de assinatura
-- Data: 2025-11-16

-- 1. Atualizar initialize_subscription_trial
CREATE OR REPLACE FUNCTION public.initialize_subscription_trial(broker_uuid UUID)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
DECLARE
  subscription_id UUID;
  trial_end_date TIMESTAMP WITH TIME ZONE;
BEGIN
  IF EXISTS (SELECT 1 FROM public.subscriptions WHERE broker_id = broker_uuid) THEN
    RAISE EXCEPTION 'Broker já possui assinatura ativa';
  END IF;
  
  trial_end_date := now() + INTERVAL '30 days';
  
  INSERT INTO public.subscriptions (broker_id, plan_type, status, trial_start_date, trial_end_date, current_period_start, current_period_end)
  VALUES (broker_uuid, 'trial', 'trial', now(), trial_end_date, now(), trial_end_date)
  RETURNING id INTO subscription_id;
  
  UPDATE public.brokers SET trial_ends_at = trial_end_date, updated_at = now() WHERE id = broker_uuid;
  
  RETURN subscription_id;
END; $$;

-- 2. Atualizar renew_subscription
CREATE OR REPLACE FUNCTION public.renew_subscription(broker_uuid UUID, renewal_days INTEGER DEFAULT 30)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
BEGIN
  UPDATE public.subscriptions SET status = 'active', plan_type = 'monthly', current_period_start = now(), current_period_end = now() + (renewal_days || ' days')::INTERVAL, updated_at = now() WHERE broker_id = broker_uuid;
  UPDATE public.brokers SET trial_ends_at = NULL, updated_at = now() WHERE id = broker_uuid;
  RETURN FOUND;
END; $$;

-- 3. Atualizar cancel_subscription
CREATE OR REPLACE FUNCTION public.cancel_subscription(broker_uuid UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
BEGIN
  UPDATE public.subscriptions SET status = 'cancelled', updated_at = now() WHERE broker_id = broker_uuid;
  UPDATE public.brokers SET is_active = false, trial_ends_at = now() - INTERVAL '1 day', updated_at = now() WHERE id = broker_uuid;
  RETURN FOUND;
END; $$;

-- 4. Criar trigger de sincronização
CREATE OR REPLACE FUNCTION public.sync_trial_ends_at() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.status = 'trial' AND NEW.trial_end_date IS NOT NULL THEN
    UPDATE public.brokers SET trial_ends_at = NEW.trial_end_date WHERE id = NEW.broker_id;
  ELSIF NEW.status IN ('active', 'cancelled') THEN
    UPDATE public.brokers SET trial_ends_at = NULL WHERE id = NEW.broker_id;
  ELSIF NEW.status = 'expired' THEN
    UPDATE public.brokers SET trial_ends_at = now() - INTERVAL '1 day' WHERE id = NEW.broker_id;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS sync_trial_ends_at_trigger ON public.subscriptions;
CREATE TRIGGER sync_trial_ends_at_trigger AFTER INSERT OR UPDATE OF status, trial_end_date ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.sync_trial_ends_at();

-- 5. View de monitoramento
CREATE OR REPLACE VIEW public.trial_status_monitor AS
SELECT b.id as broker_id, b.business_name, b.email, b.trial_ends_at, s.trial_end_date, s.status,
  CASE WHEN b.trial_ends_at IS NULL THEN 'Sem trial' WHEN b.trial_ends_at < now() THEN 'Expirado' WHEN b.trial_ends_at < now() + INTERVAL '3 days' THEN 'Expirando' ELSE 'Ativo' END as trial_status,
  EXTRACT(DAY FROM (b.trial_ends_at - now()))::INTEGER as days_remaining
FROM public.brokers b LEFT JOIN public.subscriptions s ON s.broker_id = b.id
WHERE b.trial_ends_at IS NOT NULL OR s.status = 'trial';
