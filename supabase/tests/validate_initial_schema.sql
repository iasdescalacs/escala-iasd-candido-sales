-- Validacao local em PostgreSQL puro.
-- Cria stubs minimos do Supabase Auth para checar sintaxe, RLS, FKs e seed.

\set ON_ERROR_STOP on

create schema if not exists auth;
create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text unique
);

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon;
  end if;

  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated;
  end if;

  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role;
  end if;
end;
$$;

create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select null::uuid
$$;

\i /supabase/migrations/20260907162000_initial_schema.sql
\i /supabase/migrations/20260907173000_auth_access_policies.sql
\i /supabase/migrations/20260908013500_allow_manual_admin_recovery.sql
\i /supabase/migrations/20260908021500_seed_default_roles.sql
\i /supabase/migrations/20260908033000_create_worship_services.sql
\i /supabase/migrations/20260908043000_add_special_worship_services.sql
\i /supabase/migrations/20260908043100_adjust_special_worship_uniqueness.sql
\i /supabase/migrations/20260908120000_create_user_availability.sql
\i /supabase/migrations/20260910123000_distinguish_special_service_availability.sql
\i /supabase/seed.sql

do $$
declare
  rls_tables integer;
  policy_count integer;
  seeded_users integer;
begin
  select count(*)
  into rls_tables
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname in (
      'users',
      'roles',
      'churches',
      'user_roles',
      'user_church_links',
      'history',
      'settings',
      'notifications',
      'worship_services',
      'user_availability'
    )
    and c.relrowsecurity is true
    and c.relforcerowsecurity is true;

  if rls_tables <> 10 then
    raise exception 'RLS esperado em 10 tabelas, encontrado %.', rls_tables;
  end if;

  select count(*)
  into policy_count
  from pg_policies
  where schemaname = 'public';

  if policy_count < 14 then
    raise exception 'Politicas esperadas >= 14, encontrado %.', policy_count;
  end if;

  select count(*)
  into seeded_users
  from public.users;

  if seeded_users < 4 then
    raise exception 'Seed deveria criar pelo menos 4 usuarios, encontrou %.', seeded_users;
  end if;
end;
$$;
