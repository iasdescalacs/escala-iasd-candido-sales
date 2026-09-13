-- Impede cultos duplicados no mesmo horario e permite substituicao atomica por culto especial.

create temporary table worship_service_duplicate_map on commit drop as
with ranked_services as (
  select
    service.id,
    service.church_id,
    service.service_date,
    service.start_time,
    row_number() over (
      partition by service.church_id, service.service_date, service.start_time
      order by
        case when service.service_type = 'especial' then 0 else 1 end,
        (
          (service.preacher_user_id is not null)::integer
          + (service.singer_user_id is not null)::integer
        ) desc,
        service.created_at,
        service.id
    ) as service_rank
  from public.worship_services as service
  where service.deleted_at is null
)
select
  duplicate.id as duplicate_id,
  keeper.id as keeper_id
from ranked_services as duplicate
join ranked_services as keeper
  on keeper.church_id = duplicate.church_id
  and keeper.service_date = duplicate.service_date
  and keeper.start_time = duplicate.start_time
  and keeper.service_rank = 1
where duplicate.service_rank > 1;

-- Preserva os nomes e as pessoas ja escaladas antes de remover registros repetidos.
update public.worship_services as keeper
set
  preacher_user_id = coalesce(
    keeper.preacher_user_id,
    (
      select source.preacher_user_id
      from public.worship_services as source
      join worship_service_duplicate_map as duplicate
        on duplicate.duplicate_id = source.id
      where duplicate.keeper_id = keeper.id
        and source.preacher_user_id is not null
      order by source.created_at, source.id
      limit 1
    )
  ),
  preacher_name = coalesce(
    keeper.preacher_name,
    (
      select source.preacher_name
      from public.worship_services as source
      join worship_service_duplicate_map as duplicate
        on duplicate.duplicate_id = source.id
      where duplicate.keeper_id = keeper.id
        and source.preacher_name is not null
      order by source.created_at, source.id
      limit 1
    )
  ),
  singer_user_id = coalesce(
    keeper.singer_user_id,
    (
      select source.singer_user_id
      from public.worship_services as source
      join worship_service_duplicate_map as duplicate
        on duplicate.duplicate_id = source.id
      where duplicate.keeper_id = keeper.id
        and source.singer_user_id is not null
      order by source.created_at, source.id
      limit 1
    )
  ),
  singer_name = coalesce(
    keeper.singer_name,
    (
      select source.singer_name
      from public.worship_services as source
      join worship_service_duplicate_map as duplicate
        on duplicate.duplicate_id = source.id
      where duplicate.keeper_id = keeper.id
        and source.singer_name is not null
      order by source.created_at, source.id
      limit 1
    )
  )
where exists (
  select 1
  from worship_service_duplicate_map as duplicate
  where duplicate.keeper_id = keeper.id
);

-- Mantem uma unica disponibilidade especial ativa por pessoa, funcao e culto consolidado.
delete from public.user_availability as availability
using worship_service_duplicate_map as duplicate
where availability.worship_service_id = duplicate.duplicate_id
  and availability.deleted_at is null
  and (
    exists (
      select 1
      from public.user_availability as keeper_availability
      where keeper_availability.worship_service_id = duplicate.keeper_id
        and keeper_availability.user_id = availability.user_id
        and keeper_availability.role_id = availability.role_id
        and keeper_availability.deleted_at is null
    )
    or exists (
      select 1
      from public.user_availability as earlier_availability
      join worship_service_duplicate_map as earlier_duplicate
        on earlier_duplicate.duplicate_id = earlier_availability.worship_service_id
      where earlier_duplicate.keeper_id = duplicate.keeper_id
        and earlier_availability.user_id = availability.user_id
        and earlier_availability.role_id = availability.role_id
        and earlier_availability.deleted_at is null
        and earlier_availability.id < availability.id
    )
  );

update public.user_availability as availability
set
  worship_service_id = duplicate.keeper_id,
  updated_at = now()
from worship_service_duplicate_map as duplicate
where availability.worship_service_id = duplicate.duplicate_id;

delete from public.swap_requests as swap_request
where exists (
  select 1
  from worship_service_duplicate_map as duplicate
  where duplicate.duplicate_id in (
    swap_request.source_service_id,
    swap_request.target_service_id
  )
);

delete from public.worship_services as service
using worship_service_duplicate_map as duplicate
where service.id = duplicate.duplicate_id;

create unique index if not exists worship_services_unique_active_church_time
  on public.worship_services (church_id, service_date, start_time)
  where deleted_at is null;

create or replace function public.replace_special_worship_services(
  actor_id uuid,
  target_church_id uuid,
  service_rows jsonb
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  service_row jsonb;
  processed_services bigint := 0;
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
    raise exception 'Administrador aprovado nao localizado.';
  end if;

  if not exists (
    select 1
    from public.churches as church
    where church.id = target_church_id
      and church.active is true
      and church.deleted_at is null
  ) then
    raise exception 'Igreja ativa nao localizada.';
  end if;

  if jsonb_typeof(service_rows) <> 'array' then
    raise exception 'Lista de cultos especiais invalida.';
  end if;

  for service_row in
    select item.value
    from jsonb_array_elements(service_rows) as item(value)
  loop
    insert into public.worship_services (
      church_id,
      service_date,
      service_type,
      special_type,
      is_special,
      title,
      start_time,
      end_time
    ) values (
      target_church_id,
      (service_row ->> 'service_date')::date,
      'especial',
      (service_row ->> 'special_type')::public.worship_special_type,
      true,
      service_row ->> 'title',
      (service_row ->> 'start_time')::time,
      (service_row ->> 'end_time')::time
    )
    on conflict (church_id, service_date, start_time)
      where deleted_at is null
    do update set
      service_type = 'especial',
      special_type = excluded.special_type,
      is_special = true,
      title = excluded.title,
      end_time = excluded.end_time,
      updated_at = now();

    processed_services := processed_services + 1;
  end loop;

  insert into public.history (
    actor_user_id,
    entity_table,
    action,
    details
  ) values (
    actor_id,
    'worship_services',
    'replace_with_special',
    jsonb_build_object(
      'church_id', target_church_id,
      'processed_services', processed_services
    )
  );

  return processed_services;
end;
$$;

revoke all on function public.replace_special_worship_services(uuid, uuid, jsonb)
  from public, anon, authenticated;
grant execute on function public.replace_special_worship_services(uuid, uuid, jsonb)
  to service_role;

create or replace function public.delete_worship_service(
  actor_id uuid,
  target_service_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_service public.worship_services%rowtype;
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
    raise exception 'Administrador aprovado nao localizado.';
  end if;

  select service.*
  into target_service
  from public.worship_services as service
  where service.id = target_service_id
    and service.deleted_at is null;

  if not found then
    return false;
  end if;

  delete from public.worship_services
  where id = target_service_id;

  insert into public.history (
    actor_user_id,
    entity_table,
    entity_id,
    action,
    details
  ) values (
    actor_id,
    'worship_services',
    target_service.id,
    'delete',
    jsonb_build_object(
      'church_id', target_service.church_id,
      'service_date', target_service.service_date,
      'start_time', target_service.start_time,
      'service_type', target_service.service_type,
      'title', target_service.title
    )
  );

  return true;
end;
$$;

revoke all on function public.delete_worship_service(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.delete_worship_service(uuid, uuid)
  to service_role;
