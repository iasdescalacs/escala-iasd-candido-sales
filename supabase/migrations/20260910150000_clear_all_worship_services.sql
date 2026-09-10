-- Permite ao servidor limpar todos os cultos e dados de escala relacionados em uma transação.

create or replace function public.clear_all_worship_services(actor_id uuid)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  deleted_services bigint;
begin
  if not exists (
    select 1
    from public.users as app_user
    join public.user_roles as user_role
      on user_role.user_id = app_user.id
      and user_role.deleted_at is null
    join public.roles as role
      on role.id = user_role.role_id
      and role.deleted_at is null
    where app_user.id = actor_id
      and app_user.status = 'approved'
      and app_user.deleted_at is null
      and role.key = 'admin'
  ) then
    raise exception 'Administrador aprovado não localizado.';
  end if;

  delete from public.swap_requests;
  delete from public.user_availability;
  delete from public.worship_services;
  get diagnostics deleted_services = row_count;

  insert into public.history (
    actor_user_id,
    entity_table,
    action,
    details
  ) values (
    actor_id,
    'worship_services',
    'delete_all',
    jsonb_build_object('deleted_services', deleted_services)
  );

  return deleted_services;
end;
$$;

revoke all on function public.clear_all_worship_services(uuid)
  from public, anon, authenticated;
grant execute on function public.clear_all_worship_services(uuid)
  to service_role;
