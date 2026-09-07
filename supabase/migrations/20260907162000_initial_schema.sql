-- Etapa 4: banco inicial do ESCALA IASD CANDIDO SALES.
-- Esta migration cria a base relacional, ativa RLS e define politicas minimas.

create extension if not exists "pgcrypto";
create extension if not exists "citext";

create type public.user_status as enum ('pending', 'approved', 'blocked', 'inactive');
create type public.role_key as enum ('admin', 'anciao', 'lider_musica', 'pregador', 'cantor');
create type public.notification_status as enum ('unread', 'read', 'archived');

create table public.users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  full_name text not null,
  email citext not null unique,
  phone text,
  status public.user_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint users_full_name_not_blank check (length(trim(full_name)) > 0),
  constraint users_email_not_blank check (length(trim(email::text)) > 0)
);

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  key public.role_key not null unique,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.churches (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  city text not null default 'Candido Sales',
  state char(2) not null default 'BA',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint churches_name_not_blank check (length(trim(name)) > 0)
);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete restrict,
  assigned_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.user_church_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  church_id uuid not null references public.churches(id) on delete cascade,
  role_id uuid references public.roles(id) on delete set null,
  can_be_scheduled boolean not null default false,
  is_manager boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.history (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.users(id) on delete set null,
  entity_table text not null,
  entity_id uuid,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint history_entity_table_not_blank check (length(trim(entity_table)) > 0),
  constraint history_action_not_blank check (length(trim(action)) > 0)
);

create table public.settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb not null default '{}'::jsonb,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint settings_key_not_blank check (length(trim(key)) > 0)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  body text not null,
  status public.notification_status not null default 'unread',
  metadata jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint notifications_title_not_blank check (length(trim(title)) > 0)
);

create unique index user_roles_unique_active_role
  on public.user_roles (user_id, role_id)
  where deleted_at is null;

create unique index user_church_links_unique_active_link
  on public.user_church_links (user_id, church_id, role_id)
  where deleted_at is null;

create index users_auth_user_id_idx on public.users (auth_user_id);
create index users_status_idx on public.users (status) where deleted_at is null;
create index users_deleted_at_idx on public.users (deleted_at);
create index roles_key_idx on public.roles (key) where deleted_at is null;
create index churches_active_idx on public.churches (active) where deleted_at is null;
create index churches_deleted_at_idx on public.churches (deleted_at);
create index user_roles_user_id_idx on public.user_roles (user_id) where deleted_at is null;
create index user_roles_role_id_idx on public.user_roles (role_id) where deleted_at is null;
create index user_church_links_user_id_idx on public.user_church_links (user_id) where deleted_at is null;
create index user_church_links_church_id_idx on public.user_church_links (church_id) where deleted_at is null;
create index user_church_links_role_id_idx on public.user_church_links (role_id) where deleted_at is null;
create index history_actor_user_id_idx on public.history (actor_user_id);
create index history_entity_idx on public.history (entity_table, entity_id);
create index settings_key_idx on public.settings (key) where deleted_at is null;
create index notifications_user_status_idx on public.notifications (user_id, status) where deleted_at is null;
create index notifications_created_at_idx on public.notifications (created_at desc) where deleted_at is null;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_users_updated_at before update on public.users
  for each row execute function public.set_updated_at();
create trigger set_roles_updated_at before update on public.roles
  for each row execute function public.set_updated_at();
create trigger set_churches_updated_at before update on public.churches
  for each row execute function public.set_updated_at();
create trigger set_user_roles_updated_at before update on public.user_roles
  for each row execute function public.set_updated_at();
create trigger set_user_church_links_updated_at before update on public.user_church_links
  for each row execute function public.set_updated_at();
create trigger set_history_updated_at before update on public.history
  for each row execute function public.set_updated_at();
create trigger set_settings_updated_at before update on public.settings
  for each row execute function public.set_updated_at();
create trigger set_notifications_updated_at before update on public.notifications
  for each row execute function public.set_updated_at();

create or replace function public.current_app_user_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select u.id
  from public.users u
  where u.auth_user_id = auth.uid()
    and u.status = 'approved'
    and u.deleted_at is null
  limit 1
$$;

create or replace function public.current_user_has_role(target_role public.role_key)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users u
    join public.user_roles ur on ur.user_id = u.id and ur.deleted_at is null
    join public.roles r on r.id = ur.role_id and r.deleted_at is null
    where u.auth_user_id = auth.uid()
      and u.status = 'approved'
      and u.deleted_at is null
      and r.key = target_role
  )
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_has_role('admin')
$$;

revoke all on all tables in schema public from anon, authenticated;
grant usage on schema public to anon, authenticated;
grant select, insert, update on public.users to authenticated;
grant select on public.roles to authenticated;
grant select on public.churches to authenticated;
grant select on public.user_roles to authenticated;
grant select on public.user_church_links to authenticated;
grant select on public.settings to authenticated;
grant select, update on public.notifications to authenticated;
grant execute on function public.current_app_user_id() to authenticated;
grant execute on function public.current_user_has_role(public.role_key) to authenticated;
grant execute on function public.is_admin() to authenticated;

alter table public.users enable row level security;
alter table public.roles enable row level security;
alter table public.churches enable row level security;
alter table public.user_roles enable row level security;
alter table public.user_church_links enable row level security;
alter table public.history enable row level security;
alter table public.settings enable row level security;
alter table public.notifications enable row level security;

alter table public.users force row level security;
alter table public.roles force row level security;
alter table public.churches force row level security;
alter table public.user_roles force row level security;
alter table public.user_church_links force row level security;
alter table public.history force row level security;
alter table public.settings force row level security;
alter table public.notifications force row level security;

create policy "usuarios veem proprio cadastro ou admin"
  on public.users for select
  to authenticated
  using (
    deleted_at is null
    and (
      auth_user_id = auth.uid()
      or public.is_admin()
    )
  );

create policy "usuarios criam cadastro pendente"
  on public.users for insert
  to authenticated
  with check (
    auth.uid() is not null
    and auth_user_id = auth.uid()
    and status = 'pending'
    and deleted_at is null
  );

create policy "usuarios atualizam proprio cadastro permitido"
  on public.users for update
  to authenticated
  using (
    deleted_at is null
    and (
      auth_user_id = auth.uid()
      or public.is_admin()
    )
  )
  with check (
    deleted_at is null
    and (
      auth_user_id = auth.uid()
      or public.is_admin()
    )
  );

create policy "perfis visiveis para aprovados"
  on public.roles for select
  to authenticated
  using (
    deleted_at is null
    and (
      public.current_app_user_id() is not null
      or public.is_admin()
    )
  );

create policy "igrejas visiveis para aprovados"
  on public.churches for select
  to authenticated
  using (
    deleted_at is null
    and active is true
    and (
      public.current_app_user_id() is not null
      or public.is_admin()
    )
  );

create policy "vinculos de perfis visiveis ao proprio usuario"
  on public.user_roles for select
  to authenticated
  using (
    deleted_at is null
    and (
      user_id = public.current_app_user_id()
      or public.is_admin()
    )
  );

create policy "vinculos com igrejas visiveis ao proprio usuario"
  on public.user_church_links for select
  to authenticated
  using (
    deleted_at is null
    and (
      user_id = public.current_app_user_id()
      or public.is_admin()
    )
  );

create policy "historico somente admin"
  on public.history for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "configuracoes visiveis para aprovados"
  on public.settings for select
  to authenticated
  using (
    deleted_at is null
    and (
      public.current_app_user_id() is not null
      or public.is_admin()
    )
  );

create policy "notificacoes visiveis ao destinatario"
  on public.notifications for select
  to authenticated
  using (
    deleted_at is null
    and (
      user_id = public.current_app_user_id()
      or public.is_admin()
    )
  );

create policy "notificacoes atualizadas pelo destinatario"
  on public.notifications for update
  to authenticated
  using (
    deleted_at is null
    and (
      user_id = public.current_app_user_id()
      or public.is_admin()
    )
  )
  with check (
    deleted_at is null
    and (
      user_id = public.current_app_user_id()
      or public.is_admin()
    )
  );
