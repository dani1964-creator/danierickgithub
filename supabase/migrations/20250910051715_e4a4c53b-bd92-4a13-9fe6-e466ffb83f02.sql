-- First, update the duplicate slug to make it unique
UPDATE public.brokers 
SET website_slug = 'rf-imobiliaria'
WHERE email = 'danierick.erick@hotmail.com' 
AND website_slug = 'home';

-- Now add the unique constraint
ALTER TABLE public.brokers 
ADD CONSTRAINT unique_website_slug UNIQUE (website_slug);

-- Create a function to validate unique slugs
CREATE OR REPLACE FUNCTION validate_unique_website_slug()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if slug already exists (excluding current record if updating)
  IF EXISTS (
    SELECT 1 FROM public.brokers 
    WHERE website_slug = NEW.website_slug 
    AND id != COALESCE(NEW.id, gen_random_uuid())
    AND website_slug IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Website slug "%" already exists. Please choose a unique slug.', NEW.website_slug;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to enforce unique slugs
CREATE TRIGGER validate_website_slug_unique
  BEFORE INSERT OR UPDATE ON public.brokers
  FOR EACH ROW
  EXECUTE FUNCTION validate_unique_website_slug();