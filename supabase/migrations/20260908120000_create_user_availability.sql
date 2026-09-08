-- Etapa 7: disponibilidade por usuario, funcao e data de culto.

create table if not exists public.user_availability (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  service_date date not null,
  available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create unique index if not exists user_availability_unique_active_day
  on public.user_availability (user_id, role_id, service_date)
  where deleted_at is null;

create index if not exists user_availability_role_date_idx
  on public.user_availability (role_id, service_date)
  where available is true and deleted_at is null;

create index if not exists user_availability_user_idx
  on public.user_availability (user_id)
  where deleted_at is null;

drop trigger if exists set_user_availability_updated_at on public.user_availability;
create trigger set_user_availability_updated_at before update on public.user_availability
  for each row execute function public.set_updated_at();

grant select, insert, update, delete on public.user_availability to authenticated;

alter table public.user_availability enable row level security;
alter table public.user_availability force row level security;

drop policy if exists "disponibilidade visivel ao proprio usuario ou admin" on public.user_availability;
drop policy if exists "disponibilidade gerenciada pelo proprio usuario ou admin" on public.user_availability;

create policy "disponibilidade visivel ao proprio usuario ou admin"
  on public.user_availability for select
  to authenticated
  using (
    deleted_at is null
    and (
      user_id = public.current_app_user_id()
      or public.is_admin()
    )
  );

create policy "disponibilidade gerenciada pelo proprio usuario ou admin"
  on public.user_availability for all
  to authenticated
  using (
    deleted_at is null
    and (
      user_id = public.current_app_user_id()
      or public.is_admin()
    )
  )
  with check (
    deleted_at is null
    and (
      user_id = public.current_app_user_id()
      or public.is_admin()
    )
  );
