-- Migration: Adicionar campo trial_ends_at na tabela brokers
-- Data: 2025-11-16
-- Descrição: Adicionar controle de período de trial para auto-cadastro

-- Adicionar coluna trial_ends_at
ALTER TABLE public.brokers 
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE;

-- Adicionar índice para facilitar queries de trial expirado
CREATE INDEX IF NOT EXISTS idx_brokers_trial_ends_at 
ON public.brokers(trial_ends_at) 
WHERE trial_ends_at IS NOT NULL;

-- Comentário explicativo
COMMENT ON COLUMN public.brokers.trial_ends_at IS 'Data de término do período de teste gratuito. NULL = não está em trial';

-- Função helper para verificar se trial expirou
CREATE OR REPLACE FUNCTION public.is_trial_expired(broker_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  trial_end TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT trial_ends_at INTO trial_end
  FROM public.brokers
  WHERE id = broker_id;
  
  IF trial_end IS NULL THEN
    RETURN FALSE; -- Não está em trial
  END IF;
  
  RETURN trial_end < NOW();
END;
$$;

COMMENT ON FUNCTION public.is_trial_expired IS 'Verifica se o período de trial de um broker expirou';
