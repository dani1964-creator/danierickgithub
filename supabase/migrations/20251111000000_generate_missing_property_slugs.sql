-- Generate slugs for existing properties that don't have one
-- This is a one-time migration to backfill slugs for properties created before the slug system

-- Update properties without slugs
UPDATE public.properties
SET slug = public.generate_slug(title) || '-' || SUBSTRING(id::text, 1, 8)
WHERE slug IS NULL OR slug = '';

-- Add comment for documentation
COMMENT ON COLUMN public.properties.slug IS 'SEO-friendly URL slug for the property, auto-generated from title';
