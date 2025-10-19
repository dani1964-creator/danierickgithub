-- Exemplo: vincular um domínio personalizado a uma corretora
-- Substitua :broker_id pelo ID da sua corretora
-- O domínio deve estar configurado como CNAME no DNS apontando para o host do app
insert into public.broker_domains (broker_id, domain, is_active)
values ('00000000-0000-0000-0000-000000000000', 'vitrine.exemplo.com.br', true);

-- Para desativar temporariamente sem apagar:
-- update public.broker_domains set is_active = false where domain = 'vitrine.exemplo.com.br';
