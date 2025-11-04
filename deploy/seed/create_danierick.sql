-- SQL seed to insert a test broker 'danierick' into the 'brokers' table
-- Run this in Supabase SQL editor or via psql connected to your database.

-- WARNING: adjust column names/types to match your schema. This script assumes
-- columns: id (uuid), name, business_name, email, website_slug, subdomain, custom_domain, is_active, created_at

-- Replace uuid_generate_v4() with gen_random_uuid() if your Postgres uses pgcrypto.

INSERT INTO brokers (id, name, business_name, email, website_slug, subdomain, custom_domain, is_active, created_at)
VALUES (
  COALESCE(uuid_generate_v4(), gen_random_uuid()),
  'Danierick',
  'Imobiliária Danierick',
  'danierick.erick@hotmail.com',
  'danierick',
  'danierick',
  NULL,
  true,
  now()
)
ON CONFLICT (website_slug) DO UPDATE SET
  name = EXCLUDED.name,
  business_name = EXCLUDED.business_name,
  email = EXCLUDED.email,
  subdomain = EXCLUDED.subdomain,
  is_active = EXCLUDED.is_active;
