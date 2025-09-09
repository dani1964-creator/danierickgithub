-- Add SEO and meta fields to brokers table
ALTER TABLE public.brokers 
ADD COLUMN site_title TEXT,
ADD COLUMN site_description TEXT,
ADD COLUMN site_favicon_url TEXT,
ADD COLUMN site_share_image_url TEXT;