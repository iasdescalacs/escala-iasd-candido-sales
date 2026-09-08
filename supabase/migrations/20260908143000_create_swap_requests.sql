-- Etapa 8: pedidos de permuta de escala.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'swap_request_status' and typnamespace = 'public'::regnamespace) then
    create type public.swap_request_status as enum ('pending', 'approved', 'rejected', 'cancelled');
  end if;
end;
$$;

create table if not exists public.swap_requests (
  id uuid primary key default gen_random_uuid(),
  requester_user_id uuid not null references public.users(id) on delete cascade,
  target_user_id uuid not null references public.users(id) on delete cascade,
  source_service_id uuid not null references public.worship_services(id) on delete cascade,
  target_service_id uuid not null references public.worship_services(id) on delete cascade,
  role_key public.role_key not null,
  status public.swap_request_status not null default 'pending',
  reason text,
  decided_by_user_id uuid references public.users(id) on delete set null,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint swap_requests_distinct_services check (source_service_id <> target_service_id),
  constraint swap_requests_distinct_users check (requester_user_id <> target_user_id),
  constraint swap_requests_assignable_role check (role_key in ('pregador', 'cantor'))
);

create index if not exists swap_requests_status_idx
  on public.swap_requests (status)
  where deleted_at is null;

create index if not exists swap_requests_requester_idx
  on public.swap_requests (requester_user_id)
  where deleted_at is null;

create index if not exists swap_requests_target_idx
  on public.swap_requests (target_user_id)
  where deleted_at is null;

create index if not exists swap_requests_services_idx
  on public.swap_requests (source_service_id, target_service_id)
  where deleted_at is null;

drop trigger if exists set_swap_requests_updated_at on public.swap_requests;
create trigger set_swap_requests_updated_at before update on public.swap_requests
  for each row execute function public.set_updated_at();

grant select, insert, update on public.swap_requests to authenticated;

alter table public.swap_requests enable row level security;
alter table public.swap_requests force row level security;

drop policy if exists "permutas visiveis aos envolvidos ou admin" on public.swap_requests;
drop policy if exists "permutas solicitadas pelo usuario ou admin" on public.swap_requests;

create policy "permutas visiveis aos envolvidos ou admin"
  on public.swap_requests for select
  to authenticated
  using (
    deleted_at is null
    and (
      requester_user_id = public.current_app_user_id()
      or target_user_id = public.current_app_user_id()
      or public.is_admin()
    )
  );

create policy "permutas solicitadas pelo usuario ou admin"
  on public.swap_requests for insert
  to authenticated
  with check (
    deleted_at is null
    and (
      requester_user_id = public.current_app_user_id()
      or public.is_admin()
    )
  );

create policy "permutas atualizadas por admin"
  on public.swap_requests for update
  to authenticated
  using (deleted_at is null and public.is_admin())
  with check (deleted_at is null and public.is_admin());
