-- Add custom color fields to brokers table
-- Allows brokers to customize specific UI element colors

ALTER TABLE brokers
ADD COLUMN IF NOT EXISTS detail_header_text_color TEXT,
ADD COLUMN IF NOT EXISTS detail_button_color TEXT,
ADD COLUMN IF NOT EXISTS search_button_color TEXT;

COMMENT ON COLUMN brokers.detail_header_text_color IS 
'Cor personalizada para o texto "Detalhes do Imóvel" no header da página de detalhes. Se null, usa primary_color.';

COMMENT ON COLUMN brokers.detail_button_color IS 
'Cor personalizada para os botões "Ver Detalhes Completos" nos cards de propriedades. Se null, usa primary_color.';

COMMENT ON COLUMN brokers.search_button_color IS 
'Cor personalizada para o botão "Buscar" no campo de pesquisa. Se null, usa primary_color.';
