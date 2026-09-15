-- O acesso do Pastor e global e deriva exclusivamente da funcao atribuida.
-- Disponibilidades de Pregador/Cantor e vinculos locais de Lider de Musica sao preservados.
update public.user_church_links as link
set
  deleted_at = now(),
  updated_at = now()
from public.roles as role
where role.id = link.role_id
  and role.key = 'pastor'
  and link.deleted_at is null;
