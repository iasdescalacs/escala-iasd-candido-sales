-- Permite cultos especiais distintos na mesma data quando nome ou horario forem diferentes.

drop index if exists public.worship_services_unique_active_service;

create unique index if not exists worship_services_unique_active_regular_service
  on public.worship_services (church_id, service_date, service_type)
  where deleted_at is null
    and service_type <> 'especial';

create unique index if not exists worship_services_unique_active_special_service
  on public.worship_services (church_id, service_date, start_time, title)
  where deleted_at is null
    and service_type = 'especial';
