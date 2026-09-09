-- Registra auditoria da aprovacao de cadastros pendentes.

alter table public.users
  add column if not exists approved_by_user_id uuid references public.users(id) on delete set null,
  add column if not exists approved_at timestamptz;

create index if not exists users_approved_by_user_id_idx
  on public.users (approved_by_user_id)
  where approved_by_user_id is not null;

create index if not exists users_pending_created_at_idx
  on public.users (created_at desc)
  where status = 'pending' and deleted_at is null;
