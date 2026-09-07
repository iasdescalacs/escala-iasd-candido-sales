-- Script manual: limpar dados operacionais e manter somente o usuario Admin informado.
-- Uso com psql:
--   psql "$DATABASE_URL" -v admin_email='email@dominio.com' -f supabase/manual/reset-keep-admin.sql
-- Revise antes de executar. Este script apaga dados das tabelas publicas do sistema.

\set ON_ERROR_STOP on

select count(*) as admin_count
from public.users u
join public.user_roles ur on ur.user_id = u.id and ur.deleted_at is null
join public.roles r on r.id = ur.role_id and r.key = 'admin'
where u.email = :'admin_email'
  and u.deleted_at is null
\gset

\if :admin_count == 0
  \echo 'Admin informado nao encontrado ou sem perfil admin.'
  \quit 1
\endif

begin;

delete from public.notifications
where user_id not in (select id from public.users where email = :'admin_email');

delete from public.history
where actor_user_id not in (select id from public.users where email = :'admin_email')
   or actor_user_id is null;

delete from public.user_church_links
where user_id not in (select id from public.users where email = :'admin_email');

delete from public.user_roles
where user_id not in (select id from public.users where email = :'admin_email');

delete from public.users
where email <> :'admin_email';

delete from public.churches;

insert into public.history (actor_user_id, entity_table, entity_id, action, details)
select u.id,
       'database',
       u.id,
       'manual.reset_keep_admin',
       jsonb_build_object('admin_email', u.email)
from public.users u
where u.email = :'admin_email';

commit;
