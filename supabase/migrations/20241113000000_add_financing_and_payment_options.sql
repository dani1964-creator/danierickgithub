-- Migration: Add financing and payment options to properties
-- Created: 2024-11-13

-- Adicionar colunas para simulador de financiamento
ALTER TABLE properties ADD COLUMN IF NOT EXISTS financing_enabled BOOLEAN DEFAULT false;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS financing_down_payment_percentage INTEGER DEFAULT 20;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS financing_max_installments INTEGER DEFAULT 360;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS financing_interest_rate DECIMAL(5,2) DEFAULT 9.00;

-- Badge "Oportunidade"
ALTER TABLE properties ADD COLUMN IF NOT EXISTS show_opportunity_badge BOOLEAN DEFAULT false;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS opportunity_badge_text TEXT DEFAULT 'Oportunidade!';

-- Formas de pagamento
ALTER TABLE properties ADD COLUMN IF NOT EXISTS payment_methods_type TEXT DEFAULT 'none'; -- 'none', 'text', 'banner'
ALTER TABLE properties ADD COLUMN IF NOT EXISTS payment_methods_text TEXT[];
ALTER TABLE properties ADD COLUMN IF NOT EXISTS payment_methods_banner_url TEXT;

-- Comentários para documentação
COMMENT ON COLUMN properties.financing_enabled IS 'Habilita exibição do card de financiamento';
COMMENT ON COLUMN properties.financing_down_payment_percentage IS 'Percentual da entrada (padrão 20%)';
COMMENT ON COLUMN properties.financing_max_installments IS 'Número máximo de parcelas (padrão 360)';
COMMENT ON COLUMN properties.financing_interest_rate IS 'Taxa de juros anual (padrão 9.00%)';
COMMENT ON COLUMN properties.show_opportunity_badge IS 'Exibe badge "Oportunidade!" na galeria';
COMMENT ON COLUMN properties.opportunity_badge_text IS 'Texto customizado do badge de oportunidade';
COMMENT ON COLUMN properties.payment_methods_type IS 'Tipo de exibição: none, text ou banner';
COMMENT ON COLUMN properties.payment_methods_text IS 'Array de formas de pagamento (quando type=text)';
COMMENT ON COLUMN properties.payment_methods_banner_url IS 'URL do banner customizado (quando type=banner)';
