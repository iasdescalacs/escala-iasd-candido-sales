-- Permite scripts administrativos diretos no banco, sem sessao Supabase Auth.
-- A protecao para navegador/app continua dependendo de RLS e policies.

create or replace function public.prevent_user_security_field_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  if old.auth_user_id is distinct from new.auth_user_id
    or old.email is distinct from new.email
    or old.status is distinct from new.status
    or old.deleted_at is distinct from new.deleted_at then
    raise exception 'Campos sensiveis do usuario so podem ser alterados por administrador.';
  end if;

  return new;
end;
$$;
