-- Etapa 6: cultos mensais gerados por igreja.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'worship_service_type' and typnamespace = 'public'::regnamespace) then
    create type public.worship_service_type as enum ('quarta', 'sabado', 'domingo');
  end if;
end;
$$;

create table if not exists public.worship_services (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  service_date date not null,
  service_type public.worship_service_type not null,
  start_time time not null,
  end_time time not null,
  preacher_user_id uuid references public.users(id) on delete set null,
  singer_user_id uuid references public.users(id) on delete set null,
  preacher_name text,
  singer_name text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint worship_services_valid_time check (end_time > start_time)
);

create unique index if not exists worship_services_unique_active_service
  on public.worship_services (church_id, service_date, service_type)
  where deleted_at is null;

create index if not exists worship_services_church_date_idx
  on public.worship_services (church_id, service_date)
  where deleted_at is null;

create index if not exists worship_services_date_idx
  on public.worship_services (service_date)
  where deleted_at is null;

create index if not exists worship_services_preacher_idx
  on public.worship_services (preacher_user_id)
  where preacher_user_id is not null and deleted_at is null;

create index if not exists worship_services_singer_idx
  on public.worship_services (singer_user_id)
  where singer_user_id is not null and deleted_at is null;

drop trigger if exists set_worship_services_updated_at on public.worship_services;
create trigger set_worship_services_updated_at before update on public.worship_services
  for each row execute function public.set_updated_at();

grant select, insert, update on public.worship_services to authenticated;

alter table public.worship_services enable row level security;
alter table public.worship_services force row level security;

drop policy if exists "cultos visiveis para aprovados" on public.worship_services;
drop policy if exists "cultos gerenciados por admin" on public.worship_services;

create policy "cultos visiveis para aprovados"
  on public.worship_services for select
  to authenticated
  using (
    deleted_at is null
    and (
      public.current_app_user_id() is not null
      or public.is_admin()
    )
  );

create policy "cultos gerenciados por admin"
  on public.worship_services for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
