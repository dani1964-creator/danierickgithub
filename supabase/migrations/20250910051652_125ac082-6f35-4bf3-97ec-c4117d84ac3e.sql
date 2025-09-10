-- First, resolve the duplicate slug conflict
-- Update the broker with email 'danierick.erick@hotmail.com' to use a unique slug
UPDATE public.brokers 
SET website_slug = 'rf-imobiliaria'
WHERE email = 'danierick.erick@hotmail.com' 
AND website_slug = 'home';

-- Now add unique constraint
ALTER TABLE public.brokers 
ADD CONSTRAINT unique_website_slug UNIQUE (website_slug);