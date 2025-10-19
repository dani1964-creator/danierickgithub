-- Tabela para mapear domínios personalizados aos brokers
create table if not exists public.broker_domains (
  id uuid primary key default gen_random_uuid(),
  broker_id uuid not null references public.brokers(id) on delete cascade,
  domain text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Habilitar RLS e permitir SELECT público apenas de domínios ativos
alter table public.broker_domains enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'broker_domains' and policyname = 'broker_domains_public_select'
  ) then
    create policy broker_domains_public_select
      on public.broker_domains
      for select
      to anon
      using (is_active = true);
  end if;
end$$;

comment on table public.broker_domains is 'Mapeia domínios customizados (CNAME) para brokers específicos';
comment on column public.broker_domains.domain is 'Domínio totalmente qualificado (ex.: vitrine.imobiliariax.com)';

-- Atualizar cache do PostgREST
notify pgrst, 'reload schema';
