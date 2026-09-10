-- Compatibiliza a limpeza com a protecao do banco que exige WHERE em DELETE.

create or replace function public.clear_all_worship_services(
  actor_id uuid,
  dry_run boolean default false
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_stage text := 'validar administrador';
  deleted_services bigint := 0;
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

  begin
    current_stage := 'remover permutas';
    delete from public.swap_requests where true;

    current_stage := 'remover disponibilidades';
    delete from public.user_availability where true;

    current_stage := 'remover cultos';
    delete from public.worship_services where true;
    get diagnostics deleted_services = row_count;

    current_stage := 'registrar histórico';
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

    if dry_run then
      raise sqlstate 'ZX001' using message = 'Rollback da simulação.';
    end if;
  exception
    when sqlstate 'ZX001' then
      null;
    when others then
      raise exception 'Falha ao limpar cultos na etapa "%".', current_stage
        using detail = sqlerrm;
  end;

  return deleted_services;
end;
$$;

revoke all on function public.clear_all_worship_services(uuid, boolean)
  from public, anon, authenticated;
grant execute on function public.clear_all_worship_services(uuid, boolean)
  to service_role;
