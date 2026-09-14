-- Formacoes musicais, disponibilidade coletiva e permissoes globais do Pastor.

insert into public.roles (key, name, description)
values (
  'pastor',
  'Pastor',
  'Gerencia pregacao, cultos e cadastros em todas as igrejas.'
)
on conflict (key) where deleted_at is null
do update set
  name = excluded.name,
  description = excluded.description,
  updated_at = now();

do $$
begin
  if not exists (select 1 from pg_type where typname = 'musical_formation_type') then
    create type public.musical_formation_type as enum ('solo', 'dupla', 'trio', 'grupo');
  end if;

  if not exists (select 1 from pg_type where typname = 'musical_formation_status') then
    create type public.musical_formation_status as enum ('pending', 'active', 'inactive');
  end if;

  if not exists (select 1 from pg_type where typname = 'musical_member_role') then
    create type public.musical_member_role as enum ('responsavel', 'integrante');
  end if;
end
$$;

create table if not exists public.musical_formations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  formation_type public.musical_formation_type not null,
  status public.musical_formation_status not null default 'pending',
  home_church_id uuid not null references public.churches(id) on delete restrict,
  created_by_user_id uuid references public.users(id) on delete set null,
  approved_by_user_id uuid references public.users(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint musical_formations_name_length check (char_length(btrim(name)) between 3 and 100)
);

create table if not exists public.musical_formation_members (
  id uuid primary key default gen_random_uuid(),
  formation_id uuid not null references public.musical_formations(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  member_role public.musical_member_role not null default 'integrante',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.musical_formation_churches (
  id uuid primary key default gen_random_uuid(),
  formation_id uuid not null references public.musical_formations(id) on delete cascade,
  church_id uuid not null references public.churches(id) on delete cascade,
  can_be_scheduled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.musical_formation_availability (
  id uuid primary key default gen_random_uuid(),
  formation_id uuid not null references public.musical_formations(id) on delete cascade,
  worship_service_id uuid not null references public.worship_services(id) on delete cascade,
  service_date date not null,
  available boolean not null default true,
  managed_by_user_id uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

alter table public.worship_services
  add column if not exists singer_formation_id uuid
    references public.musical_formations(id) on delete set null;

create unique index if not exists musical_formations_unique_active_name
  on public.musical_formations (lower(btrim(name)), home_church_id)
  where deleted_at is null;

create index if not exists musical_formations_home_church_idx
  on public.musical_formations (home_church_id, status)
  where deleted_at is null;

create unique index if not exists musical_formation_members_unique_active
  on public.musical_formation_members (formation_id, user_id)
  where deleted_at is null;

create index if not exists musical_formation_members_user_idx
  on public.musical_formation_members (user_id, formation_id)
  where deleted_at is null;

create unique index if not exists musical_formation_churches_unique_active
  on public.musical_formation_churches (formation_id, church_id)
  where deleted_at is null;

create index if not exists musical_formation_churches_church_idx
  on public.musical_formation_churches (church_id, formation_id)
  where can_be_scheduled is true and deleted_at is null;

create unique index if not exists musical_formation_availability_unique_active
  on public.musical_formation_availability (formation_id, worship_service_id)
  where deleted_at is null;

create index if not exists musical_formation_availability_date_idx
  on public.musical_formation_availability (formation_id, service_date)
  where available is true and deleted_at is null;

create index if not exists worship_services_singer_formation_idx
  on public.worship_services (singer_formation_id, service_date)
  where singer_formation_id is not null and deleted_at is null;

drop trigger if exists set_musical_formations_updated_at on public.musical_formations;
create trigger set_musical_formations_updated_at
  before update on public.musical_formations
  for each row execute function public.set_updated_at();

drop trigger if exists set_musical_formation_members_updated_at on public.musical_formation_members;
create trigger set_musical_formation_members_updated_at
  before update on public.musical_formation_members
  for each row execute function public.set_updated_at();

drop trigger if exists set_musical_formation_churches_updated_at on public.musical_formation_churches;
create trigger set_musical_formation_churches_updated_at
  before update on public.musical_formation_churches
  for each row execute function public.set_updated_at();

drop trigger if exists set_musical_formation_availability_updated_at on public.musical_formation_availability;
create trigger set_musical_formation_availability_updated_at
  before update on public.musical_formation_availability
  for each row execute function public.set_updated_at();

create or replace function public.user_has_role(
  actor_id uuid,
  target_role public.role_key
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
    join public.user_roles as user_role
      on user_role.user_id = app_user.id
      and user_role.deleted_at is null
    join public.roles as role
      on role.id = user_role.role_id
      and role.deleted_at is null
    where app_user.id = actor_id
      and app_user.status = 'approved'
      and app_user.deleted_at is null
      and role.key = target_role
  );
$$;

create or replace function public.user_manages_church_as(
  actor_id uuid,
  target_church_id uuid,
  manager_role public.role_key
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
    join public.user_roles as user_role
      on user_role.user_id = app_user.id
      and user_role.deleted_at is null
    join public.roles as role
      on role.id = user_role.role_id
      and role.deleted_at is null
      and role.key = manager_role
    join public.user_church_links as church_link
      on church_link.user_id = app_user.id
      and church_link.role_id = role.id
      and church_link.church_id = target_church_id
      and church_link.is_manager is true
      and church_link.deleted_at is null
    where app_user.id = actor_id
      and app_user.status = 'approved'
      and app_user.deleted_at is null
  );
$$;

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
  select
    public.user_has_role(actor_id, 'admin')
    or public.user_has_role(actor_id, 'pastor')
    or public.user_manages_church_as(actor_id, target_church_id, 'anciao');
$$;

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
    and (
      public.user_has_role(actor_id, 'admin')
      or (
        target_role = 'pregador'
        and public.user_has_role(actor_id, 'pastor')
      )
      or (
        target_role = 'pregador'
        and public.user_manages_church_as(actor_id, target_church_id, 'anciao')
      )
      or (
        target_role = 'cantor'
        and public.user_manages_church_as(actor_id, target_church_id, 'lider_musica')
      )
    );
$$;

create or replace function public.can_manage_musical_formation(
  actor_id uuid,
  target_formation_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.musical_formations as formation
    where formation.id = target_formation_id
      and formation.deleted_at is null
      and (
        public.user_has_role(actor_id, 'admin')
        or public.user_manages_church_as(actor_id, formation.home_church_id, 'lider_musica')
        or exists (
          select 1
          from public.musical_formation_members as member
          where member.formation_id = formation.id
            and member.user_id = actor_id
            and member.member_role = 'responsavel'
            and member.deleted_at is null
        )
      )
  );
$$;

create or replace function public.current_user_can_manage_musical_formation(
  target_formation_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.can_manage_musical_formation(
    public.current_app_user_id(),
    target_formation_id
  );
$$;

create or replace function public.save_musical_formation(
  actor_id uuid,
  target_formation_id uuid,
  target_name text,
  target_type public.musical_formation_type,
  target_home_church_id uuid,
  target_member_ids uuid[],
  target_responsible_ids uuid[],
  target_church_ids uuid[],
  target_status public.musical_formation_status
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  saved_formation_id uuid;
  normalized_name text := nullif(btrim(target_name), '');
  normalized_member_ids uuid[];
  normalized_responsible_ids uuid[];
  normalized_church_ids uuid[];
  member_count integer;
  actor_can_activate boolean;
  existing_status public.musical_formation_status;
  actor_is_responsible boolean;
begin
  if normalized_name is null or char_length(normalized_name) not between 3 and 100 then
    raise exception 'Informe um nome entre 3 e 100 caracteres.';
  end if;

  if not exists (
    select 1 from public.churches as church
    where church.id = target_home_church_id
      and church.active is true
      and church.deleted_at is null
  ) then
    raise exception 'Igreja de origem nao localizada.';
  end if;

  select coalesce(array_agg(distinct member_id), '{}'::uuid[])
  into normalized_member_ids
  from unnest(coalesce(target_member_ids, '{}'::uuid[])) as member_id;

  select coalesce(array_agg(distinct responsible_id), '{}'::uuid[])
  into normalized_responsible_ids
  from unnest(coalesce(target_responsible_ids, '{}'::uuid[])) as responsible_id;

  select coalesce(array_agg(distinct church_id), '{}'::uuid[])
  into normalized_church_ids
  from unnest(array_append(coalesce(target_church_ids, '{}'::uuid[]), target_home_church_id)) as church_id;

  member_count := cardinality(normalized_member_ids);

  if target_type = 'solo' and member_count <> 1 then
    raise exception 'Uma formacao solo precisa ter exatamente um integrante.';
  elsif target_type = 'dupla' and member_count <> 2 then
    raise exception 'Uma dupla precisa ter exatamente dois integrantes.';
  elsif target_type = 'trio' and member_count <> 3 then
    raise exception 'Um trio precisa ter exatamente tres integrantes.';
  elsif target_type = 'grupo' and member_count < 2 then
    raise exception 'Um grupo precisa ter pelo menos dois integrantes.';
  end if;

  if cardinality(normalized_responsible_ids) = 0
    or not normalized_responsible_ids <@ normalized_member_ids
  then
    raise exception 'Escolha ao menos um responsavel entre os integrantes.';
  end if;

  if exists (
    select 1
    from unnest(normalized_member_ids) as selected_user(id)
    where not exists (
      select 1
      from public.users as app_user
      join public.user_roles as user_role
        on user_role.user_id = app_user.id
        and user_role.deleted_at is null
      join public.roles as role
        on role.id = user_role.role_id
        and role.key = 'cantor'
        and role.deleted_at is null
      where app_user.id = selected_user.id
        and app_user.status = 'approved'
        and app_user.deleted_at is null
    )
  ) then
    raise exception 'Todos os integrantes precisam ser cantores aprovados.';
  end if;

  if exists (
    select 1
    from unnest(normalized_church_ids) as selected_church(id)
    where not exists (
      select 1 from public.churches as church
      where church.id = selected_church.id
        and church.active is true
        and church.deleted_at is null
    )
  ) then
    raise exception 'Uma ou mais igrejas atendidas sao invalidas.';
  end if;

  actor_can_activate :=
    public.user_has_role(actor_id, 'admin')
    or public.user_manages_church_as(actor_id, target_home_church_id, 'lider_musica');

  if target_formation_id is null then
    if not (
      actor_can_activate
      or (
        public.user_has_role(actor_id, 'cantor')
        and actor_id = any(normalized_responsible_ids)
      )
    ) then
      raise exception 'Voce nao tem permissao para criar esta formacao.';
    end if;

    insert into public.musical_formations (
      name,
      formation_type,
      status,
      home_church_id,
      created_by_user_id,
      approved_by_user_id,
      approved_at
    ) values (
      normalized_name,
      target_type,
      case when actor_can_activate then coalesce(target_status, 'active') else 'pending' end,
      target_home_church_id,
      actor_id,
      case when actor_can_activate then actor_id else null end,
      case when actor_can_activate then now() else null end
    )
    returning id into saved_formation_id;
  else
    if not public.can_manage_musical_formation(actor_id, target_formation_id) then
      raise exception 'Voce nao tem permissao para alterar esta formacao.';
    end if;

    select status into existing_status
    from public.musical_formations
    where id = target_formation_id
      and deleted_at is null
    for update;

    if not found then
      raise exception 'Formacao nao localizada.';
    end if;

    select exists (
      select 1
      from public.musical_formation_members as member
      where member.formation_id = target_formation_id
        and member.user_id = actor_id
        and member.member_role = 'responsavel'
        and member.deleted_at is null
    ) into actor_is_responsible;

    if not actor_can_activate
      and not public.user_has_role(actor_id, 'admin')
      and not actor_is_responsible
    then
      raise exception 'Voce nao gerencia a nova igreja de origem desta formacao.';
    end if;

    update public.musical_formations
    set
      name = normalized_name,
      formation_type = target_type,
      home_church_id = target_home_church_id,
      status = case when actor_can_activate then coalesce(target_status, existing_status) else existing_status end,
      approved_by_user_id = case
        when actor_can_activate and coalesce(target_status, existing_status) = 'active' then actor_id
        else approved_by_user_id
      end,
      approved_at = case
        when actor_can_activate and coalesce(target_status, existing_status) = 'active' then coalesce(approved_at, now())
        else approved_at
      end
    where id = target_formation_id
    returning id into saved_formation_id;

    delete from public.musical_formation_members where formation_id = saved_formation_id;
    delete from public.musical_formation_churches where formation_id = saved_formation_id;
  end if;

  insert into public.musical_formation_members (formation_id, user_id, member_role)
  select
    saved_formation_id,
    member_id,
    case
      when member_id = any(normalized_responsible_ids) then 'responsavel'::public.musical_member_role
      else 'integrante'::public.musical_member_role
    end
  from unnest(normalized_member_ids) as member_id;

  insert into public.musical_formation_churches (formation_id, church_id, can_be_scheduled)
  select saved_formation_id, church_id, true
  from unnest(normalized_church_ids) as church_id;

  insert into public.history (
    actor_user_id,
    entity_table,
    entity_id,
    action,
    details
  ) values (
    actor_id,
    'musical_formations',
    saved_formation_id,
    case when target_formation_id is null then 'create' else 'update' end,
    jsonb_build_object(
      'name', normalized_name,
      'formation_type', target_type,
      'member_count', member_count,
      'church_ids', normalized_church_ids
    )
  );

  return saved_formation_id;
end;
$$;

create or replace function public.set_musical_formation_availability(
  actor_id uuid,
  target_formation_id uuid,
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
  selected_count bigint := 0;
begin
  if not public.can_manage_musical_formation(actor_id, target_formation_id) then
    raise exception 'Voce nao tem permissao para alterar esta disponibilidade.';
  end if;

  if not exists (
    select 1 from public.musical_formations
    where id = target_formation_id
      and status = 'active'
      and deleted_at is null
  ) then
    raise exception 'A formacao precisa estar ativa para informar disponibilidade.';
  end if;

  if period_start is null
    or period_end is null
    or period_start <> date_trunc('month', period_start)::date
    or period_end <> (date_trunc('month', period_start) + interval '1 month - 1 day')::date
  then
    raise exception 'Informe um mes completo e valido.';
  end if;

  if exists (
    select 1
    from unnest(coalesce(selected_service_ids, '{}'::uuid[])) as selected(id)
    where not exists (
      select 1
      from public.worship_services as service
      join public.musical_formation_churches as formation_church
        on formation_church.formation_id = target_formation_id
        and formation_church.church_id = service.church_id
        and formation_church.can_be_scheduled is true
        and formation_church.deleted_at is null
      where service.id = selected.id
        and service.service_date between period_start and period_end
        and service.deleted_at is null
    )
  ) then
    raise exception 'Um ou mais cultos nao pertencem as igrejas atendidas pela formacao.';
  end if;

  delete from public.musical_formation_availability
  where formation_id = target_formation_id
    and service_date between period_start and period_end;

  insert into public.musical_formation_availability (
    formation_id,
    worship_service_id,
    service_date,
    available,
    managed_by_user_id
  )
  select
    target_formation_id,
    service.id,
    service.service_date,
    true,
    actor_id
  from public.worship_services as service
  where service.id = any(coalesce(selected_service_ids, '{}'::uuid[]))
    and service.service_date between period_start and period_end
    and service.deleted_at is null;

  get diagnostics selected_count = row_count;

  insert into public.history (
    actor_user_id,
    entity_table,
    entity_id,
    action,
    details
  ) values (
    actor_id,
    'musical_formation_availability',
    target_formation_id,
    'save_month',
    jsonb_build_object(
      'period_start', period_start,
      'period_end', period_end,
      'selected_services', selected_count
    )
  );

  return selected_count;
end;
$$;

revoke all on function public.user_has_role(uuid, public.role_key) from public, anon, authenticated;
revoke all on function public.user_manages_church_as(uuid, uuid, public.role_key) from public, anon, authenticated;
revoke all on function public.can_manage_musical_formation(uuid, uuid) from public, anon, authenticated;
revoke all on function public.current_user_can_manage_musical_formation(uuid) from public, anon, authenticated;
revoke all on function public.save_musical_formation(
  uuid, uuid, text, public.musical_formation_type, uuid, uuid[], uuid[], uuid[], public.musical_formation_status
) from public, anon, authenticated;
revoke all on function public.set_musical_formation_availability(uuid, uuid, date, date, uuid[])
  from public, anon, authenticated;

grant execute on function public.user_has_role(uuid, public.role_key) to service_role;
grant execute on function public.user_manages_church_as(uuid, uuid, public.role_key) to service_role;
grant execute on function public.can_manage_musical_formation(uuid, uuid) to service_role;
grant execute on function public.save_musical_formation(
  uuid, uuid, text, public.musical_formation_type, uuid, uuid[], uuid[], uuid[], public.musical_formation_status
) to service_role;
grant execute on function public.set_musical_formation_availability(uuid, uuid, date, date, uuid[])
  to service_role;

grant execute on function public.current_user_can_manage_musical_formation(uuid) to authenticated;
grant select on public.musical_formations to authenticated;
grant select on public.musical_formation_members to authenticated;
grant select on public.musical_formation_churches to authenticated;
grant select on public.musical_formation_availability to authenticated;

alter table public.musical_formations enable row level security;
alter table public.musical_formation_members enable row level security;
alter table public.musical_formation_churches enable row level security;
alter table public.musical_formation_availability enable row level security;

alter table public.musical_formations force row level security;
alter table public.musical_formation_members force row level security;
alter table public.musical_formation_churches force row level security;
alter table public.musical_formation_availability force row level security;

create policy "formacoes visiveis para aprovados"
  on public.musical_formations for select
  to authenticated
  using (
    deleted_at is null
    and public.current_app_user_id() is not null
  );

create policy "integrantes de formacoes visiveis para aprovados"
  on public.musical_formation_members for select
  to authenticated
  using (
    deleted_at is null
    and public.current_app_user_id() is not null
  );

create policy "igrejas de formacoes visiveis para aprovados"
  on public.musical_formation_churches for select
  to authenticated
  using (
    deleted_at is null
    and public.current_app_user_id() is not null
  );

create policy "disponibilidade de formacoes visivel para aprovados"
  on public.musical_formation_availability for select
  to authenticated
  using (
    deleted_at is null
    and public.current_app_user_id() is not null
  );
