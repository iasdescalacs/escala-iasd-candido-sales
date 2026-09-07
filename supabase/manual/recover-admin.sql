-- Script manual: recuperar vinculo administrativo de um usuario ja cadastrado.
-- Diferente do promote-admin, este script tambem limpa bloqueio/inatividade.
-- Uso com psql:
--   psql "$DATABASE_URL" -v admin_email='email@dominio.com' -f supabase/manual/recover-admin.sql

\set ON_ERROR_STOP on

begin;

insert into public.roles (key, name, description)
values ('admin', 'Administrador', 'Gerencia todo o sistema.')
on conflict (key) do update
set name = excluded.name,
    description = excluded.description,
    updated_at = now(),
    deleted_at = null;

update public.users
set status = 'approved',
    deleted_at = null,
    updated_at = now()
where email = :'admin_email';

insert into public.user_roles (user_id, role_id)
select u.id, r.id
from public.users u
join public.roles r on r.key = 'admin'
where u.email = :'admin_email'
on conflict do nothing;

insert into public.history (actor_user_id, entity_table, entity_id, action, details)
select u.id,
       'users',
       u.id,
       'manual.recover_admin',
       jsonb_build_object('email', u.email)
from public.users u
where u.email = :'admin_email';

commit;
