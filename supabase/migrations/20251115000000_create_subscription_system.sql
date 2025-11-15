-- Migration: Sistema de Assinatura Manual com PIX
-- Data: 2025-11-15
-- Descrição: Criar tabelas para gestão de assinaturas, pagamentos PIX e comunicação admin-cliente

-- 1. Tabela de assinaturas
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id UUID NOT NULL REFERENCES public.brokers(id) ON DELETE CASCADE,
  
  -- Dados da assinatura
  plan_type TEXT NOT NULL DEFAULT 'monthly', -- monthly, trial
  status TEXT NOT NULL DEFAULT 'trial', -- trial, active, expired, cancelled
  monthly_price_cents INTEGER NOT NULL DEFAULT 6700, -- R$ 67,00
  
  -- Períodos
  trial_start_date TIMESTAMP WITH TIME ZONE,
  trial_end_date TIMESTAMP WITH TIME ZONE,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  
  -- Dados PIX para pagamento
  pix_key TEXT, -- Chave PIX (CPF, email, etc.)
  pix_qr_code_image_url TEXT, -- URL da imagem do QR Code
  
  -- Controle administrativo
  auto_renew BOOLEAN DEFAULT false, -- Renovação automática (manual por enquanto)
  notes TEXT, -- Observações do admin
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Tabela de comunicação entre admin e cliente (tickets/mensagens)
CREATE TABLE IF NOT EXISTS public.subscription_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  broker_id UUID NOT NULL REFERENCES public.brokers(id) ON DELETE CASCADE,
  
  -- Dados da mensagem
  sender_type TEXT NOT NULL, -- 'admin' ou 'client'
  sender_id UUID, -- ID do remetente (admin user ou broker)
  message TEXT NOT NULL,
  subject TEXT, -- Assunto da mensagem
  
  -- Status
  is_read BOOLEAN DEFAULT false,
  priority TEXT DEFAULT 'normal', -- low, normal, high, urgent
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- 3. Triggers para updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Função para inicializar assinatura com período de teste
CREATE OR REPLACE FUNCTION public.initialize_subscription_trial(broker_uuid UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  subscription_id UUID;
  trial_days INTEGER := 30;
BEGIN
  -- Verificar se broker já tem assinatura
  IF EXISTS (SELECT 1 FROM public.subscriptions WHERE broker_id = broker_uuid) THEN
    RAISE EXCEPTION 'Broker já possui assinatura ativa';
  END IF;
  
  -- Criar assinatura de teste
  INSERT INTO public.subscriptions (
    broker_id,
    plan_type,
    status,
    trial_start_date,
    trial_end_date,
    current_period_start,
    current_period_end
  ) VALUES (
    broker_uuid,
    'trial',
    'trial',
    now(),
    now() + INTERVAL '30 days',
    now(),
    now() + INTERVAL '30 days'
  ) RETURNING id INTO subscription_id;
  
  RETURN subscription_id;
END;
$$;

-- 5. Função para calcular dias restantes da assinatura
CREATE OR REPLACE FUNCTION public.get_subscription_days_remaining(broker_uuid UUID)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  end_date TIMESTAMP WITH TIME ZONE;
  days_remaining INTEGER;
BEGIN
  SELECT current_period_end INTO end_date
  FROM public.subscriptions
  WHERE broker_id = broker_uuid
  AND status IN ('trial', 'active');
  
  IF end_date IS NULL THEN
    RETURN -1; -- Sem assinatura ativa
  END IF;
  
  days_remaining := EXTRACT(DAY FROM (end_date - now()));
  
  RETURN GREATEST(days_remaining, 0);
END;
$$;

-- 6. Função para renovar assinatura (admin only)
CREATE OR REPLACE FUNCTION public.renew_subscription(
  broker_uuid UUID,
  renewal_days INTEGER DEFAULT 30
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE public.subscriptions
  SET 
    status = 'active',
    plan_type = 'monthly',
    current_period_start = now(),
    current_period_end = now() + (renewal_days || ' days')::INTERVAL,
    updated_at = now()
  WHERE broker_id = broker_uuid;
  
  RETURN FOUND;
END;
$$;

-- 7. Função para cancelar assinatura (desativa broker)
CREATE OR REPLACE FUNCTION public.cancel_subscription(broker_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Marcar assinatura como cancelada
  UPDATE public.subscriptions
  SET 
    status = 'cancelled',
    updated_at = now()
  WHERE broker_id = broker_uuid;
  
  -- Desativar broker
  UPDATE public.brokers
  SET 
    is_active = false,
    updated_at = now()
  WHERE id = broker_uuid;
  
  RETURN FOUND;
END;
$$;

-- 8. View para dados completos de assinatura
CREATE OR REPLACE VIEW public.subscription_details AS
SELECT 
  s.*,
  b.business_name,
  b.email,
  b.website_slug,
  b.is_active as broker_is_active,
  public.get_subscription_days_remaining(s.broker_id) as days_remaining,
  CASE 
    WHEN s.status = 'trial' THEN 'Período de Teste'
    WHEN s.status = 'active' THEN 'Ativo'
    WHEN s.status = 'expired' THEN 'Vencido'
    WHEN s.status = 'cancelled' THEN 'Cancelado'
    ELSE 'Desconhecido'
  END as status_label
FROM public.subscriptions s
JOIN public.brokers b ON s.broker_id = b.id;

-- 9. RLS (Row Level Security)
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_communications ENABLE ROW LEVEL SECURITY;

-- Policy para subscriptions: broker só vê sua própria assinatura
CREATE POLICY "Brokers can view own subscription"
  ON public.subscriptions
  FOR SELECT
  TO authenticated
  USING (
    broker_id IN (
      SELECT id FROM public.brokers WHERE user_id = auth.uid()
    )
  );

-- Policy para subscription_communications: broker só vê suas próprias mensagens
CREATE POLICY "Brokers can view own communications"
  ON public.subscription_communications
  FOR SELECT
  TO authenticated
  USING (
    broker_id IN (
      SELECT id FROM public.brokers WHERE user_id = auth.uid()
    )
  );

-- Policy para broker inserir mensagens
CREATE POLICY "Brokers can insert own communications"
  ON public.subscription_communications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    broker_id IN (
      SELECT id FROM public.brokers WHERE user_id = auth.uid()
    )
    AND sender_type = 'client'
  );

-- 10. Trigger para criar assinatura automaticamente para novos brokers
CREATE OR REPLACE FUNCTION public.create_subscription_for_new_broker()
RETURNS TRIGGER AS $$
BEGIN
  -- Criar assinatura de teste para novo broker
  PERFORM public.initialize_subscription_trial(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_subscription_for_new_broker
  AFTER INSERT ON public.brokers
  FOR EACH ROW
  EXECUTE FUNCTION public.create_subscription_for_new_broker();

-- 11. Inicializar assinaturas para brokers existentes (executar apenas uma vez)
-- Definir data de vencimento de 30 dias a partir de hoje para brokers ativos
DO $$
DECLARE
  broker_record RECORD;
BEGIN
  FOR broker_record IN 
    SELECT id FROM public.brokers 
    WHERE is_active = true 
    AND id NOT IN (SELECT broker_id FROM public.subscriptions)
  LOOP
    PERFORM public.initialize_subscription_trial(broker_record.id);
  END LOOP;
END $$;

-- 12. Função para verificar assinaturas vencidas e gerar notificações
CREATE OR REPLACE FUNCTION public.check_subscription_expiration()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  sub_record RECORD;
  days_remaining INTEGER;
  notification_title TEXT;
  notification_message TEXT;
BEGIN
  FOR sub_record IN 
    SELECT s.*, b.business_name
    FROM public.subscriptions s
    JOIN public.brokers b ON s.broker_id = b.id
    WHERE s.status IN ('trial', 'active')
  LOOP
    days_remaining := public.get_subscription_days_remaining(sub_record.broker_id);
    
    -- Notificações de aviso (3, 2, 1 dia antes)
    IF days_remaining = 3 THEN
      notification_title := 'Assinatura vence em 3 dias';
      notification_message := 'Sua assinatura vence em 3 dias. Efetue o pagamento para manter o acesso.';
    ELSIF days_remaining = 2 THEN
      notification_title := 'Assinatura vence em 2 dias';
      notification_message := 'Sua assinatura vence em 2 dias. Efetue o pagamento para manter o acesso.';
    ELSIF days_remaining = 1 THEN
      notification_title := 'Assinatura vence AMANHÃ';
      notification_message := 'Sua assinatura vence amanhã! Efetue o pagamento urgentemente.';
    ELSIF days_remaining = 0 THEN
      notification_title := 'Assinatura VENCEU';
      notification_message := 'Sua assinatura venceu hoje. Entre em contato para renovar.';
    ELSIF days_remaining < 0 THEN
      -- Vencido há mais de 1 dia - desativar
      PERFORM public.cancel_subscription(sub_record.broker_id);
      notification_title := 'Assinatura cancelada';
      notification_message := 'Sua assinatura foi cancelada por falta de pagamento. Site público desativado.';
    END IF;
    
    -- Inserir notificação se necessário
    IF notification_title IS NOT NULL THEN
      INSERT INTO public.broker_notifications (
        broker_id,
        title,
        message,
        type
      ) VALUES (
        sub_record.broker_id,
        notification_title,
        notification_message,
        'subscription_warning'
      );
    END IF;
    
    -- Reset variables
    notification_title := NULL;
    notification_message := NULL;
  END LOOP;
END;
$$;

-- 13. Comentários para documentação
COMMENT ON TABLE public.subscriptions IS 'Tabela de assinaturas do sistema SaaS com período de teste';
COMMENT ON TABLE public.subscription_communications IS 'Sistema de tickets/mensagens entre admin e clientes';
COMMENT ON FUNCTION public.initialize_subscription_trial IS 'Inicializa período de teste de 30 dias para novo broker';
COMMENT ON FUNCTION public.get_subscription_days_remaining IS 'Calcula dias restantes da assinatura ativa';
COMMENT ON FUNCTION public.renew_subscription IS 'Renova assinatura por X dias (admin)';
COMMENT ON FUNCTION public.cancel_subscription IS 'Cancela assinatura e desativa broker';
COMMENT ON FUNCTION public.check_subscription_expiration IS 'Verifica vencimentos e gera notificações automáticas';