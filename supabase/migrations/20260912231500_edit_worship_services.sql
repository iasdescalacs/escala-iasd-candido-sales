-- Permite editar horario e informacoes de um culto em uma transacao auditada.

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
  into current_service
  from public.worship_services as service
  where service.id = target_service_id
    and service.deleted_at is null
  for update;

  if not found then
    return false;
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
