-- Add header_brand_image_url column to brokers table
-- This allows brokers to upload a combined logo+name image for the header
-- Dimensions suggested: ~400x80px (rectangular/horizontal)

ALTER TABLE brokers
ADD COLUMN IF NOT EXISTS header_brand_image_url TEXT;

COMMENT ON COLUMN brokers.header_brand_image_url IS 
'URL da imagem combinada de logo + nome da imobiliária para usar no header. Quando configurada, substitui logo_url + business_name no cabeçalho do site público. Dimensões sugeridas: 400x80px.';
