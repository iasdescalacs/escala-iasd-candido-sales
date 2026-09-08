-- Etapa 5: reforcos de acesso para autenticacao.
-- Impede que usuarios comuns alterem campos sensiveis do proprio cadastro.

create or replace function public.prevent_user_security_field_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_admin() then
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

drop trigger if exists prevent_user_security_field_changes on public.users;

create trigger prevent_user_security_field_changes
  before update on public.users
  for each row
  execute function public.prevent_user_security_field_changes();

grant execute on function public.prevent_user_security_field_changes() to authenticated;
