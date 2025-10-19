-- Políticas de escrita para broker_domains: permitir que o dono (broker do usuário) gerencie seus domínios
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='broker_domains' and policyname='broker_domains_owner_insert'
  ) then
    create policy broker_domains_owner_insert
      on public.broker_domains
      for insert to authenticated
      with check (
        exists (
          select 1 from public.brokers b
          where b.id = broker_domains.broker_id
            and b.user_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='broker_domains' and policyname='broker_domains_owner_update'
  ) then
    create policy broker_domains_owner_update
      on public.broker_domains
      for update to authenticated
      using (
        exists (
          select 1 from public.brokers b
          where b.id = broker_domains.broker_id
            and b.user_id = auth.uid()
        )
      )
      with check (
        exists (
          select 1 from public.brokers b
          where b.id = broker_domains.broker_id
            and b.user_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='broker_domains' and policyname='broker_domains_owner_delete'
  ) then
    create policy broker_domains_owner_delete
      on public.broker_domains
      for delete to authenticated
      using (
        exists (
          select 1 from public.brokers b
          where b.id = broker_domains.broker_id
            and b.user_id = auth.uid()
        )
      );
  end if;
end$$;

notify pgrst, 'reload schema';
