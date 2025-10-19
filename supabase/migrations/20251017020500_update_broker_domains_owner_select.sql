-- Permitir SELECT para o dono (usuário autenticado) visualizar todos os seus domínios, inclusive inativos
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='broker_domains' and policyname='broker_domains_owner_select'
  ) then
    create policy broker_domains_owner_select
      on public.broker_domains
      for select to authenticated
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
