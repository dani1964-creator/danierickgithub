-- Add brand/theme fields to brokers (idempotent)
alter table if exists public.brokers
  add column if not exists brand_primary text,
  add column if not exists brand_secondary text,
  add column if not exists brand_accent text,
  add column if not exists brand_surface text,
  add column if not exists brand_surface_fg text,
  add column if not exists brand_radius integer,
  add column if not exists brand_card_elevation integer;

-- Comments for documentation
comment on column public.brokers.brand_primary is 'Brand primary color (hex)';
comment on column public.brokers.brand_secondary is 'Brand secondary color (hex)';
comment on column public.brokers.brand_accent is 'Brand accent color (hex)';
comment on column public.brokers.brand_surface is 'Surface color for cards/sections (hex)';
comment on column public.brokers.brand_surface_fg is 'Foreground text color on surface (hex)';
comment on column public.brokers.brand_radius is 'Default border radius for components (px)';
comment on column public.brokers.brand_card_elevation is 'Default card elevation (0-24)';

-- Reload PostgREST schema cache (works on Supabase)
-- If this fails in your environment, you can reload via Dashboard > Database > API > Reset cache
notify pgrst, 'reload schema';
