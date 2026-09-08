-- Etapa 6: cultos especiais por igreja.

do $$
begin
  if not exists (
    select 1
    from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    where t.typname = 'worship_service_type'
      and e.enumlabel = 'especial'
  ) then
    alter type public.worship_service_type add value 'especial';
  end if;

  if not exists (select 1 from pg_type where typname = 'worship_special_type' and typnamespace = 'public'::regnamespace) then
    create type public.worship_special_type as enum (
      'semana_oracao',
      'mini_semana_oracao',
      'culto_gratidao',
      'culto_virada',
      'outro'
    );
  end if;
end;
$$;

alter table public.worship_services
  add column if not exists is_special boolean not null default false,
  add column if not exists special_type public.worship_special_type,
  add column if not exists title text;

create index if not exists worship_services_special_idx
  on public.worship_services (is_special, special_type)
  where deleted_at is null;
