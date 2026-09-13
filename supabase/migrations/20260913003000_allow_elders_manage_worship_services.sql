-- Permite ao anciao gerenciar cultos apenas nas igrejas onde possui vinculo gerencial.

create or replace function public.can_manage_church_worship(
  actor_id uuid,
  target_church_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.users as app_user
    where app_user.id = actor_id
      and app_user.status = 'approved'
      and app_user.deleted_at is null
      and (
        exists (
          select 1
          from public.user_roles as user_role
          join public.roles as role
            on role.id = user_role.role_id
            and role.deleted_at is null
          where user_role.user_id = app_user.id
            and user_role.deleted_at is null
            and role.key = 'admin'
        )
        or exists (
          select 1
          from public.user_roles as user_role
          join public.roles as role
            on role.id = user_role.role_id
            and role.deleted_at is null
          join public.user_church_links as church_link
            on church_link.user_id = app_user.id
            and church_link.role_id = role.id
            and church_link.church_id = target_church_id
            and church_link.is_manager is true
            and church_link.deleted_at is null
          where user_role.user_id = app_user.id
            and user_role.deleted_at is null
            and role.key = 'anciao'
        )
      )
  );
$$;

revoke all on function public.can_manage_church_worship(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.can_manage_church_worship(uuid, uuid)
  to service_role;

create or replace function public.generate_worship_services(
  actor_id uuid,
  target_church_ids uuid[],
  service_rows jsonb
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  managed_church_id uuid;
  service_row jsonb;
  inserted_for_row bigint := 0;
  inserted_services bigint := 0;
  target_service_type public.worship_service_type;
begin
  if coalesce(cardinality(target_church_ids), 0) = 0 then
    raise exception 'Nenhuma igreja foi informada.';
  end if;

  if jsonb_typeof(service_rows) <> 'array' then
    raise exception 'Lista de cultos regulares invalida.';
  end if;

  if exists (
    select 1
    from unnest(target_church_ids) as requested_church(id)
    where not public.can_manage_church_worship(actor_id, requested_church.id)
      or not exists (
        select 1
        from public.churches as church
        where church.id = requested_church.id
          and church.active is true
          and church.deleted_at is null
      )
  ) then
    raise exception 'Uma ou mais igrejas nao estao vinculadas ao gestor.';
  end if;

  for managed_church_id in
    select distinct requested_church.id
    from unnest(target_church_ids) as requested_church(id)
  loop
    for service_row in
      select item.value
      from jsonb_array_elements(service_rows) as item(value)
    loop
      target_service_type :=
        (service_row ->> 'service_type')::public.worship_service_type;

      if target_service_type = 'especial' then
        raise exception 'Use a criacao de culto especial para este tipo.';
      end if;

      insert into public.worship_services (
        church_id,
        service_date,
        service_type,
        start_time,
        end_time
      ) values (
        managed_church_id,
        (service_row ->> 'service_date')::date,
        target_service_type,
        (service_row ->> 'start_time')::time,
        (service_row ->> 'end_time')::time
      )
      on conflict do nothing;

      get diagnostics inserted_for_row = row_count;
      inserted_services := inserted_services + inserted_for_row;
    end loop;
  end loop;

  if inserted_services > 0 then
    insert into public.history (
      actor_user_id,
      entity_table,
      action,
      details
    ) values (
      actor_id,
      'worship_services',
      'generate_regular',
      jsonb_build_object(
        'church_ids', target_church_ids,
        'inserted_services', inserted_services
      )
    );
  end if;

  return inserted_services;
end;
$$;

revoke all on function public.generate_worship_services(uuid, uuid[], jsonb)
  from public, anon, authenticated;
grant execute on function public.generate_worship_services(uuid, uuid[], jsonb)
  to service_role;

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
  if not public.can_manage_church_worship(actor_id, target_church_id) then
    raise exception 'Igreja nao vinculada ao gestor.';
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

  if processed_services > 0 then
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
  end if;

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
  select service.*
  into target_service
  from public.worship_services as service
  where service.id = target_service_id
    and service.deleted_at is null
  for update;

  if not found then
    return false;
  end if;

  if not public.can_manage_church_worship(actor_id, target_service.church_id) then
    raise exception 'Igreja nao vinculada ao gestor.';
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

create or replace function public.update_worship_service(
  actor_id uuid,
  target_service_id uuid,
  target_start_time time,
  target_end_time time,
  target_title text default null,
  target_special_type public.worship_special_type default null,
  target_notes text default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_service public.worship_services%rowtype;
  normalized_title text := nullif(btrim(target_title), '');
  normalized_notes text := nullif(btrim(target_notes), '');
begin
  select service.*
  into current_service
  from public.worship_services as service
  where service.id = target_service_id
    and service.deleted_at is null
  for update;

  if not found then
    return false;
  end if;

  if not public.can_manage_church_worship(actor_id, current_service.church_id) then
    raise exception 'Igreja nao vinculada ao gestor.';
  end if;

  if target_end_time <= target_start_time then
    raise exception 'O horario de termino deve ser posterior ao inicio.';
  end if;

  if char_length(coalesce(normalized_notes, '')) > 500 then
    raise exception 'As observacoes devem ter no maximo 500 caracteres.';
  end if;

  if current_service.service_type = 'especial' then
    if normalized_title is null then
      raise exception 'Informe o nome do culto especial.';
    end if;

    if char_length(normalized_title) > 120 then
      raise exception 'O nome do culto deve ter no maximo 120 caracteres.';
    end if;

    if target_special_type is null then
      raise exception 'Informe o tipo do culto especial.';
    end if;
  else
    normalized_title := null;
    target_special_type := null;
  end if;

  if exists (
    select 1
    from public.worship_services as conflicting_service
    where conflicting_service.church_id = current_service.church_id
      and conflicting_service.service_date = current_service.service_date
      and conflicting_service.start_time = target_start_time
      and conflicting_service.id <> current_service.id
      and conflicting_service.deleted_at is null
  ) then
    raise exception 'Ja existe outro culto desta igreja na mesma data e horario.';
  end if;

  update public.worship_services
  set
    start_time = target_start_time,
    end_time = target_end_time,
    title = normalized_title,
    special_type = target_special_type,
    notes = normalized_notes,
    updated_at = now()
  where id = current_service.id;

  insert into public.history (
    actor_user_id,
    entity_table,
    entity_id,
    action,
    details
  ) values (
    actor_id,
    'worship_services',
    current_service.id,
    'update',
    jsonb_build_object(
      'before', jsonb_build_object(
        'start_time', current_service.start_time,
        'end_time', current_service.end_time,
        'title', current_service.title,
        'special_type', current_service.special_type,
        'notes', current_service.notes
      ),
      'after', jsonb_build_object(
        'start_time', target_start_time,
        'end_time', target_end_time,
        'title', normalized_title,
        'special_type', target_special_type,
        'notes', normalized_notes
      )
    )
  );

  return true;
end;
$$;

revoke all on function public.update_worship_service(
  uuid,
  uuid,
  time,
  time,
  text,
  public.worship_special_type,
  text
) from public, anon, authenticated;

grant execute on function public.update_worship_service(
  uuid,
  uuid,
  time,
  time,
  text,
  public.worship_special_type,
  text
) to service_role;
