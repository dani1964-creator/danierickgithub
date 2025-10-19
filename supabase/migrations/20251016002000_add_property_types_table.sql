-- Enable UUID generation
create extension if not exists pgcrypto;

-- 1) Create property_types table (global + per broker overrides)
create table if not exists public.property_types (
  id uuid primary key default gen_random_uuid(),
    broker_id uuid null references public.brokers(id) on delete cascade,
      value text not null,
        label text not null,
          group_label text not null,
            is_active boolean not null default true,
              created_at timestamptz not null default now()
              );

              -- Unique constraints: unique global values and unique per-broker values
              create unique index if not exists property_types_global_value_idx
                on public.property_types(value) where broker_id is null;

                create unique index if not exists property_types_broker_value_idx
                  on public.property_types(broker_id, value) where broker_id is not null;

                  -- 2) Seed global property types (idempotent)
                  insert into public.property_types (broker_id, value, label, group_label)
                  values
                    -- 🏠 Residenciais
                      (null,'house','Casa','🏠 Residenciais'),
                        (null,'sobrado','Sobrado','🏠 Residenciais'),
                          (null,'apartment','Apartamento','🏠 Residenciais'),
                            (null,'kitnet_studio','Kitnet / Studio','🏠 Residenciais'),
                              (null,'flat','Flat','🏠 Residenciais'),
                                (null,'loft','Loft','🏠 Residenciais'),
                                  (null,'cobertura','Cobertura','🏠 Residenciais'),
                                    (null,'duplex','Duplex','🏠 Residenciais'),
                                      (null,'triplex','Triplex','🏠 Residenciais'),
                                        (null,'casa_geminada','Casa geminada','🏠 Residenciais'),
                                          (null,'casa_condominio','Casa de condomínio','🏠 Residenciais'),
                                            (null,'mansao','Mansão','🏠 Residenciais'),
                                              (null,'bangalo','Bangalô','🏠 Residenciais'),
                                                (null,'chale','Chalé','🏠 Residenciais'),
                                                  (null,'edicula','Edícula','🏠 Residenciais'),
                                                    (null,'village','Village','🏠 Residenciais'),
                                                      (null,'tiny_house','Tiny House','🏠 Residenciais'),
                                                        -- 🏢 Comerciais / Empresariais
                                                          (null,'sala_comercial','Sala comercial','🏢 Comerciais / Empresariais'),
                                                            (null,'loja','Loja','🏢 Comerciais / Empresariais'),
                                                              (null,'galpao','Galpão','🏢 Comerciais / Empresariais'),
                                                                (null,'armazem','Armazém','🏢 Comerciais / Empresariais'),
                                                                  (null,'predio_comercial','Prédio comercial','🏢 Comerciais / Empresariais'),
                                                                    (null,'andar_corporativo','Andar corporativo','🏢 Comerciais / Empresariais'),
                                                                      (null,'escritorio','Escritório','🏢 Comerciais / Empresariais'),
                                                                        (null,'ponto_comercial','Ponto comercial','🏢 Comerciais / Empresariais'),
                                                                          (null,'quiosque','Quiosque','🏢 Comerciais / Empresariais'),
                                                                            (null,'box_comercial','Box comercial','🏢 Comerciais / Empresariais'),
                                                                              (null,'coworking','Coworking','🏢 Comerciais / Empresariais'),
                                                                                (null,'galeria_comercial','Galeria comercial','🏢 Comerciais / Empresariais'),
                                                                                  -- 🏗️ Terrenos e Lotes
                                                                                    (null,'land','Terreno','🏗️ Terrenos e Lotes'),
                                                                                      (null,'lote','Lote','🏗️ Terrenos e Lotes'),
                                                                                        (null,'loteamento','Loteamento','🏗️ Terrenos e Lotes'),
                                                                                          (null,'area','Área','🏗️ Terrenos e Lotes'),
                                                                                            (null,'gleba','Gleba','🏗️ Terrenos e Lotes'),
                                                                                              (null,'sitio_urbano','Sítio urbano','🏗️ Terrenos e Lotes'),
                                                                                                -- 🌾 Rurais / Agropecuários
                                                                                                  (null,'chacara','Chácara','🌾 Rurais / Agropecuários'),
                                                                                                    (null,'sitio','Sítio','🌾 Rurais / Agropecuários'),
                                                                                                      (null,'fazenda','Fazenda','🌾 Rurais / Agropecuários'),
                                                                                                        (null,'haras','Haras','🌾 Rurais / Agropecuários'),
                                                                                                          (null,'rancho','Rancho','🌾 Rurais / Agropecuários'),
                                                                                                            (null,'area_rural','Área rural','🌾 Rurais / Agropecuários'),
                                                                                                              (null,'terreno_agricola','Terreno agrícola','🌾 Rurais / Agropecuários'),
                                                                                                                (null,'propriedade_rural','Propriedade rural','🌾 Rurais / Agropecuários'),
                                                                                                                  (null,'estancia','Estância','🌾 Rurais / Agropecuários'),
                                                                                                                    -- 🏖️ Lazer e Turismo
                                                                                                                      (null,'casa_praia','Casa de praia','🏖️ Lazer e Turismo'),
                                                                                                                        (null,'casa_campo','Casa de campo','🏖️ Lazer e Turismo'),
                                                                                                                          (null,'pousada','Pousada','🏖️ Lazer e Turismo'),
                                                                                                                            (null,'hotel','Hotel','🏖️ Lazer e Turismo'),
                                                                                                                              (null,'resort','Resort','🏖️ Lazer e Turismo'),
                                                                                                                                (null,'motel','Motel','🏖️ Lazer e Turismo'),
                                                                                                                                  (null,'hostel','Hostel','🏖️ Lazer e Turismo'),
                                                                                                                                    (null,'camping','Camping','🏖️ Lazer e Turismo'),
                                                                                                                                      (null,'glamping','Glamping','🏖️ Lazer e Turismo'),
                                                                                                                                        -- 🏢 Empreendimentos e Condomínios
                                                                                                                                          (null,'condominio_fechado','Condomínio fechado','🏢 Empreendimentos e Condomínios'),
                                                                                                                                            (null,'condominio_vertical','Condomínio vertical (edifício)','🏢 Empreendimentos e Condomínios'),
                                                                                                                                              (null,'condominio_horizontal','Condomínio horizontal (vilas, casas)','🏢 Empreendimentos e Condomínios'),
                                                                                                                                                (null,'empreendimento','Empreendimento','🏢 Empreendimentos e Condomínios'),
                                                                                                                                                  (null,'complexo_imobiliario','Complexo imobiliário','🏢 Empreendimentos e Condomínios'),
                                                                                                                                                    (null,'condominio_lotes','Condomínio de lotes','🏢 Empreendimentos e Condomínios'),
                                                                                                                                                      -- 🏘️ Outros tipos específicos (inclui alguns valores já usados antes)
                                                                                                                                                        (null,'apart_hotel','Apart-hotel','🏘️ Outros tipos específicos'),
                                                                                                                                                          (null,'flat_mobiliado','Flat mobiliado','🏘️ Outros tipos específicos'),
                                                                                                                                                            (null,'casa_mista','Casa mista','🏘️ Outros tipos específicos'),
                                                                                                                                                              (null,'casa_prefabricada','Casa pré-fabricada','🏘️ Outros tipos específicos'),
                                                                                                                                                                (null,'container_house','Container house','🏘️ Outros tipos específicos'),
                                                                                                                                                                  (null,'imovel_historico','Imóvel histórico / tombado','🏘️ Outros tipos específicos'),
                                                                                                                                                                    (null,'predio_residencial','Prédio residencial','🏘️ Outros tipos específicos'),
                                                                                                                                                                      (null,'multifamiliar','Multifamiliar','🏘️ Outros tipos específicos'),
                                                                                                                                                                        (null,'duplex_comercial','Duplex comercial','🏘️ Outros tipos específicos'),
                                                                                                                                                                          (null,'condo','Condomínio','🏘️ Outros tipos específicos'),
                                                                                                                                                                            (null,'commercial','Comercial','🏘️ Outros tipos específicos')
                                                                                                                                                                            on conflict do nothing;

                                                                                                                                                                            -- 3) Add property_type_id to properties and backfill
                                                                                                                                                                            alter table if exists public.properties
                                                                                                                                                                              add column if not exists property_type_id uuid null references public.property_types(id);

                                                                                                                                                                              -- Index for faster lookups
                                                                                                                                                                              create index if not exists properties_property_type_id_idx on public.properties(property_type_id);

                                                                                                                                                                              -- Backfill property_type_id preferindo tipos do próprio broker e fallback para globais
                                                                                                                                                                              -- 1) Preferência por tipos do broker
                                                                                                                                                                              update public.properties p
                                                                                                                                                                              set property_type_id = pt_b.id
                                                                                                                                                                              from public.property_types pt_b
                                                                                                                                                                              where p.property_type_id is null
                                                                                                                                                                                and pt_b.value = p.property_type
                                                                                                                                                                                and pt_b.broker_id = p.broker_id;

                                                                                                                                                                              -- 2) Fallback para tipos globais
                                                                                                                                                                              update public.properties p
                                                                                                                                                                              set property_type_id = pt_g.id
                                                                                                                                                                              from public.property_types pt_g
                                                                                                                                                                              where p.property_type_id is null
                                                                                                                                                                                and pt_g.value = p.property_type
                                                                                                                                                                                and pt_g.broker_id is null;

                                                                                                                                                                                  -- 4) Triggers to keep property_type and property_type_id in sync
                                                                                                                                                                                  create or replace function public.properties_property_type_sync()
                                                                                                                                                                                  returns trigger as $$
                                                                                                                                                                                  declare
                                                                                                                                                                                    v_id uuid;
                                                                                                                                                                                    v_val text;
                                                                                                                                                                                  begin
                                                                                                                                                                                    -- Se property_type_id vier preenchido, valide o tenant e sincronize o texto
                                                                                                                                                                                    if TG_OP in ('INSERT','UPDATE') and NEW.property_type_id is not null then
                                                                                                                                                                                      select id, value into v_id, v_val
                                                                                                                                                                                      from public.property_types
                                                                                                                                                                                      where id = NEW.property_type_id
                                                                                                                                                                                        and (broker_id = NEW.broker_id or broker_id is null)
                                                                                                                                                                                        and is_active = true;

                                                                                                                                                                                      if v_id is null then
                                                                                                                                                                                        -- Tente resolver pelo value dentro do tenant (preferindo broker, depois global)
                                                                                                                                                                                        select id into v_id
                                                                                                                                                                                        from public.property_types
                                                                                                                                                                                        where value = coalesce(NEW.property_type, '')
                                                                                                                                                                                          and (broker_id = NEW.broker_id or broker_id is null)
                                                                                                                                                                                          and is_active = true
                                                                                                                                                                                        order by case when broker_id = NEW.broker_id then 1 else 0 end desc,
                                                                                                                                                                                                 broker_id nulls last
                                                                                                                                                                                        limit 1;

                                                                                                                                                                                        if v_id is not null then
                                                                                                                                                                                          NEW.property_type_id := v_id;
                                                                                                                                                                                        else
                                                                                                                                                                                          NEW.property_type_id := null;
                                                                                                                                                                                        end if;
                                                                                                                                                                                      else
                                                                                                                                                                                        -- ID válido para o tenant, sincronize o texto
                                                                                                                                                                                        NEW.property_type := v_val;
                                                                                                                                                                                      end if;
                                                                                                                                                                                    end if;

                                                                                                                                                                                    -- Se veio apenas o texto, resolva o ID (preferindo broker, depois global)
                                                                                                                                                                                    if (TG_OP in ('INSERT','UPDATE')) and NEW.property_type is not null and NEW.property_type_id is null then
                                                                                                                                                                                      select id into v_id
                                                                                                                                                                                      from public.property_types
                                                                                                                                                                                      where value = NEW.property_type
                                                                                                                                                                                        and (broker_id = NEW.broker_id or broker_id is null)
                                                                                                                                                                                        and is_active = true
                                                                                                                                                                                      order by case when broker_id = NEW.broker_id then 1 else 0 end desc,
                                                                                                                                                                                               broker_id nulls last
                                                                                                                                                                                      limit 1;

                                                                                                                                                                                      if v_id is not null then
                                                                                                                                                                                        NEW.property_type_id := v_id;
                                                                                                                                                                                      end if;
                                                                                                                                                                                    end if;

                                                                                                                                                                                    return NEW;
                                                                                                                                                                                  end;
                                                                                                                                                                                  $$ language plpgsql;

                                                                                                                                                                                                                                            drop trigger if exists trg_properties_property_type_sync on public.properties;
                                                                                                                                                                                                                                            create trigger trg_properties_property_type_sync
                                                                                                                                                                                                                                            before insert or update on public.properties
                                                                                                                                                                                                                                            for each row execute function public.properties_property_type_sync();

                                                                                                                                                                                                                                            -- Reload PostgREST schema cache
                                                                                                                                                                                                                                            notify pgrst, 'reload schema';
                                                                                                                                                                                                                                            