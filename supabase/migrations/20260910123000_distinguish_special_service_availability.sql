-- Diferencia disponibilidade regular por data de disponibilidade para um culto especial.

alter table public.user_availability
  add column if not exists worship_service_id uuid
    references public.worship_services(id) on delete cascade;

drop index if exists public.user_availability_unique_active_day;

create unique index if not exists user_availability_unique_active_regular_day
  on public.user_availability (user_id, role_id, service_date)
  where deleted_at is null
    and worship_service_id is null;

create unique index if not exists user_availability_unique_active_special_service
  on public.user_availability (user_id, role_id, worship_service_id)
  where deleted_at is null
    and worship_service_id is not null;

create index if not exists user_availability_special_service_idx
  on public.user_availability (role_id, worship_service_id, user_id)
  where available is true
    and deleted_at is null
    and worship_service_id is not null;
