-- Add logo_size column to brokers table
ALTER TABLE public.brokers 
ADD COLUMN logo_size INTEGER DEFAULT 80;