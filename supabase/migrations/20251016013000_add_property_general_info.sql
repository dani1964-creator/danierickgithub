-- Add general info fields to properties (idempotent)
alter table if exists public.properties
  add column if not exists hoa_fee numeric(12,2) null,
  add column if not exists hoa_periodicity text null, -- e.g., 'monthly'
  add column if not exists iptu_value numeric(12,2) null,
  add column if not exists iptu_periodicity text null, -- e.g., 'annual'
  add column if not exists built_year integer null,
  add column if not exists suites integer null,
  add column if not exists private_area_m2 numeric(10,2) null,
  add column if not exists total_area_m2 numeric(10,2) null,
  add column if not exists covered_parking_spaces integer null,
  add column if not exists floor_number integer null,
  add column if not exists total_floors integer null,
  add column if not exists sunlight_orientation text null,
  add column if not exists property_condition text null,
  add column if not exists water_cost numeric(12,2) null,
  add column if not exists electricity_cost numeric(12,2) null,
  add column if not exists furnished boolean null,
  add column if not exists accepts_pets boolean null,
  add column if not exists elevator boolean null,
  add column if not exists portaria_24h boolean null,
  add column if not exists gas_included boolean null,
  add column if not exists accessibility boolean null,
  add column if not exists heating_type text null,
  add column if not exists notes text null;

comment on column public.properties.hoa_fee is 'Condominium/HOA monthly fee (BRL)';
comment on column public.properties.hoa_periodicity is 'Periodicity for HOA fee (e.g., monthly)';
comment on column public.properties.iptu_value is 'Property tax (IPTU) amount (BRL)';
comment on column public.properties.iptu_periodicity is 'Periodicity for IPTU (e.g., annual, monthly)';
comment on column public.properties.private_area_m2 is 'Private/usable area in m2';
comment on column public.properties.total_area_m2 is 'Total area in m2';
comment on column public.properties.covered_parking_spaces is 'Number of covered parking spaces';
comment on column public.properties.sunlight_orientation is 'Sunlight orientation (face do sol)';
comment on column public.properties.property_condition is 'Condition of the property (novo, usado, reformado, etc.)';
comment on column public.properties.water_cost is 'Estimated water bill (BRL)';
comment on column public.properties.electricity_cost is 'Estimated electricity bill (BRL)';
comment on column public.properties.furnished is 'Is the property furnished?';
comment on column public.properties.accepts_pets is 'Pets allowed?';
comment on column public.properties.elevator is 'Building has elevator?';
comment on column public.properties.portaria_24h is '24h concierge/guard?';
comment on column public.properties.gas_included is 'Piped gas included?';
comment on column public.properties.accessibility is 'Accessibility features available?';
comment on column public.properties.heating_type is 'Heating type (e.g., elétrico, gás)';
comment on column public.properties.notes is 'Additional observations shown in public page';

-- Reload PostgREST schema cache
notify pgrst, 'reload schema';