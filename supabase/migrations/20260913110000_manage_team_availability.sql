-- Permite que gestores atribuam disponibilidade por culto aos voluntarios.

alter table public.user_availability
  add column if not exists managed boolean not null default false,
  add column if not exists managed_by_user_id uuid
    references public.users(id) on delete set null;

create index if not exists user_availability_managed_by_idx
  on public.user_availability (managed_by_user_id, service_date)
  where managed is true and deleted_at is null;

create or replace function public.can_manage_user_availability(
  actor_id uuid,
  target_role public.role_key,
  target_church_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    target_role in ('pregador', 'cantor')
    and exists (
      select 1
      from public.users as actor
      where actor.id = actor_id
        and actor.status = 'approved'
        and actor.deleted_at is null
        and (
          exists (
            select 1
            from public.user_roles as actor_role
            join public.roles as role
              on role.id = actor_role.role_id
              and role.deleted_at is null
            where actor_role.user_id = actor.id
              and actor_role.deleted_at is null
              and role.key = 'admin'
          )
          or exists (
            select 1
            from public.user_roles as actor_role
            join public.roles as role
              on role.id = actor_role.role_id
              and role.deleted_at is null
            join public.user_church_links as church_link
              on church_link.user_id = actor.id
              and church_link.role_id = role.id
              and church_link.church_id = target_church_id
              and church_link.is_manager is true
              and church_link.deleted_at is null
            where actor_role.user_id = actor.id
              and actor_role.deleted_at is null
              and (
                (target_role = 'pregador' and role.key = 'anciao')
                or (target_role = 'cantor' and role.key = 'lider_musica')
              )
          )
        )
    );
$$;

revoke all on function public.can_manage_user_availability(
  uuid,
  public.role_key,
  uuid
) from public, anon, authenticated;

grant execute on function public.can_manage_user_availability(
  uuid,
  public.role_key,
  uuid
) to service_role;

create or replace function public.set_managed_user_availability(
  actor_id uuid,
  target_user_id uuid,
  target_role public.role_key,
  period_start date,
  period_end date,
  selected_service_ids uuid[]
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_role_id uuid;
  selected_count bigint := 0;
  managed_service_count bigint := 0;
begin
  if target_role not in ('pregador', 'cantor') then
    raise exception 'Funcao de disponibilidade invalida.';
  end if;

  if period_start is null
    or period_end is null
    or period_start <> date_trunc('month', period_start)::date
    or period_end <> (date_trunc('month', period_start) + interval '1 month - 1 day')::date
  then
    raise exception 'Informe um mes completo e valido.';
  end if;

  select role.id
  into target_role_id
  from public.roles as role
  where role.key = target_role
    and role.deleted_at is null;

  if target_role_id is null then
    raise exception 'Funcao de disponibilidade nao localizada.';
  end if;

  if not exists (
    select 1
    from public.users as target_user
    join public.user_roles as target_user_role
      on target_user_role.user_id = target_user.id
      and target_user_role.role_id = target_role_id
      and target_user_role.deleted_at is null
    where target_user.id = target_user_id
      and target_user.status = 'approved'
      and target_user.deleted_at is null
  ) then
    raise exception 'Voluntario aprovado com essa funcao nao localizado.';
  end if;

  if not exists (
    select 1
    from public.churches as church
    where church.active is true
      and church.deleted_at is null
      and public.can_manage_user_availability(
        actor_id,
        target_role,
        church.id
      )
  ) then
    raise exception 'Gestor sem igreja vinculada para essa funcao.';
  end if;

  if exists (
    select 1
    from unnest(coalesce(selected_service_ids, '{}'::uuid[])) as selected(id)
    left join public.worship_services as service
      on service.id = selected.id
      and service.service_date between period_start and period_end
      and service.deleted_at is null
    left join public.churches as church
      on church.id = service.church_id
      and church.active is true
      and church.deleted_at is null
    where service.id is null
      or church.id is null
      or not public.can_manage_user_availability(
        actor_id,
        target_role,
        service.church_id
      )
  ) then
    raise exception 'Um ou mais cultos nao pertencem as igrejas do gestor.';
  end if;

  delete from public.user_availability as availability
  using public.worship_services as service, public.churches as church
  where availability.user_id = target_user_id
    and availability.role_id = target_role_id
    and availability.worship_service_id = service.id
    and service.church_id = church.id
    and service.service_date between period_start and period_end
    and service.deleted_at is null
    and church.active is true
    and church.deleted_at is null
    and public.can_manage_user_availability(
      actor_id,
      target_role,
      service.church_id
    );

  insert into public.user_availability (
    user_id,
    role_id,
    service_date,
    worship_service_id,
    available,
    managed,
    managed_by_user_id
  )
  select
    target_user_id,
    target_role_id,
    service.service_date,
    service.id,
    service.id = any(coalesce(selected_service_ids, '{}'::uuid[])),
    true,
    actor_id
  from public.worship_services as service
  join public.churches as church
    on church.id = service.church_id
    and church.active is true
    and church.deleted_at is null
  where service.service_date between period_start and period_end
    and service.deleted_at is null
    and public.can_manage_user_availability(
      actor_id,
      target_role,
      service.church_id
    );

  get diagnostics managed_service_count = row_count;

  select count(*)
  into selected_count
  from public.worship_services as service
  where service.id = any(coalesce(selected_service_ids, '{}'::uuid[]))
    and service.service_date between period_start and period_end
    and service.deleted_at is null;

  insert into public.history (
    actor_user_id,
    entity_table,
    entity_id,
    action,
    details
  ) values (
    actor_id,
    'user_availability',
    target_user_id,
    'manage_team_availability',
    jsonb_build_object(
      'role', target_role,
      'period_start', period_start,
      'period_end', period_end,
      'managed_services', managed_service_count,
      'selected_services', selected_count
    )
  );

  return selected_count;
end;
$$;

revoke all on function public.set_managed_user_availability(
  uuid,
  uuid,
  public.role_key,
  date,
  date,
  uuid[]
) from public, anon, authenticated;

grant execute on function public.set_managed_user_availability(
  uuid,
  uuid,
  public.role_key,
  date,
  date,
  uuid[]
) to service_role;
