-- Notificacoes push em segundo plano para dispositivos autorizados.

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  platform text,
  enabled boolean not null default true,
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint push_subscriptions_endpoint_not_blank check (length(trim(endpoint)) > 0),
  constraint push_subscriptions_p256dh_not_blank check (length(trim(p256dh)) > 0),
  constraint push_subscriptions_auth_not_blank check (length(trim(auth)) > 0)
);

create unique index if not exists push_subscriptions_endpoint_unique
  on public.push_subscriptions (endpoint);

create index if not exists push_subscriptions_user_enabled_idx
  on public.push_subscriptions (user_id, enabled)
  where deleted_at is null;

create index if not exists push_subscriptions_deleted_at_idx
  on public.push_subscriptions (deleted_at);

drop trigger if exists set_push_subscriptions_updated_at on public.push_subscriptions;
create trigger set_push_subscriptions_updated_at before update on public.push_subscriptions
  for each row execute function public.set_updated_at();

grant select, insert, update, delete on public.push_subscriptions to authenticated;

alter table public.push_subscriptions enable row level security;
alter table public.push_subscriptions force row level security;

drop policy if exists "inscricoes push visiveis ao dono" on public.push_subscriptions;
drop policy if exists "inscricoes push criadas pelo dono" on public.push_subscriptions;
drop policy if exists "inscricoes push atualizadas pelo dono" on public.push_subscriptions;
drop policy if exists "inscricoes push removidas pelo dono" on public.push_subscriptions;

create policy "inscricoes push visiveis ao dono"
  on public.push_subscriptions for select
  to authenticated
  using (
    deleted_at is null
    and (
      user_id = public.current_app_user_id()
      or public.is_admin()
    )
  );

create policy "inscricoes push criadas pelo dono"
  on public.push_subscriptions for insert
  to authenticated
  with check (
    deleted_at is null
    and enabled is true
    and user_id = public.current_app_user_id()
  );

create policy "inscricoes push atualizadas pelo dono"
  on public.push_subscriptions for update
  to authenticated
  using (
    user_id = public.current_app_user_id()
    or public.is_admin()
  )
  with check (
    user_id = public.current_app_user_id()
    or public.is_admin()
  );

create policy "inscricoes push removidas pelo dono"
  on public.push_subscriptions for delete
  to authenticated
  using (
    user_id = public.current_app_user_id()
    or public.is_admin()
  );
