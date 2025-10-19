-- Add SEO fields to brokers
alter table if exists public.brokers
  add column if not exists robots_index boolean not null default true,
  add column if not exists robots_follow boolean not null default true,
  add column if not exists canonical_prefer_custom_domain boolean not null default true,
  add column if not exists home_title_template text,
  add column if not exists home_description_template text,
  add column if not exists property_title_template text,
  add column if not exists property_description_template text;

-- Comments
comment on column public.brokers.robots_index is 'Controls meta robots index (true=index / false=noindex)';
comment on column public.brokers.robots_follow is 'Controls meta robots follow (true=follow / false=nofollow)';
comment on column public.brokers.canonical_prefer_custom_domain is 'If true, canonical uses custom_domain when available';
comment on column public.brokers.home_title_template is 'Template for home page title, supports placeholders like {business_name} {properties_count}';
comment on column public.brokers.home_description_template is 'Template for home page meta description';
comment on column public.brokers.property_title_template is 'Template for property detail title, supports placeholders like {title} {business_name}';
comment on column public.brokers.property_description_template is 'Template for property detail description, supports placeholders like {price} {bedrooms} {area_m2} {neighborhood} {uf}';
