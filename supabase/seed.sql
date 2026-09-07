-- Dados ficticios para testes locais da Etapa 4.
-- Execute somente em ambientes de desenvolvimento ou homologacao.

insert into public.roles (key, name, description)
values
  ('admin', 'Administrador', 'Gerencia todo o sistema.'),
  ('anciao', 'Anciao', 'Gerencia pregadores das igrejas vinculadas.'),
  ('lider_musica', 'Lider de Musica', 'Gerencia cantores e grupos das igrejas vinculadas.'),
  ('pregador', 'Pregador', 'Informa disponibilidade e acompanha agenda de pregacoes.'),
  ('cantor', 'Cantor', 'Informa disponibilidade e acompanha agenda musical.')
on conflict (key) do update
set name = excluded.name,
    description = excluded.description,
    updated_at = now(),
    deleted_at = null;

insert into public.churches (name, city, state, active)
values
  ('IASD Central de Candido Sales', 'Candido Sales', 'BA', true),
  ('IASD Primavera', 'Candido Sales', 'BA', true),
  ('IASD Lagoa Grande', 'Candido Sales', 'BA', true)
on conflict (name) do update
set city = excluded.city,
    state = excluded.state,
    active = excluded.active,
    updated_at = now(),
    deleted_at = null;

insert into public.users (full_name, email, phone, status)
values
  ('Admin Teste', 'admin@iasd.local', '(77) 99999-0001', 'approved'),
  ('Ana Pregadora', 'ana.pregadora@iasd.local', '(77) 99999-0002', 'approved'),
  ('Carlos Musica', 'carlos.musica@iasd.local', '(77) 99999-0003', 'approved'),
  ('Bruno Aguardando', 'bruno.aguardando@iasd.local', '(77) 99999-0004', 'pending')
on conflict (email) do update
set full_name = excluded.full_name,
    phone = excluded.phone,
    status = excluded.status,
    updated_at = now(),
    deleted_at = null;

insert into public.user_roles (user_id, role_id)
select u.id, r.id
from public.users u
join public.roles r on r.key = 'admin'
where u.email = 'admin@iasd.local'
on conflict do nothing;

insert into public.user_roles (user_id, role_id)
select u.id, r.id
from public.users u
join public.roles r on r.key = 'pregador'
where u.email = 'ana.pregadora@iasd.local'
on conflict do nothing;

insert into public.user_roles (user_id, role_id)
select u.id, r.id
from public.users u
join public.roles r on r.key = 'lider_musica'
where u.email = 'carlos.musica@iasd.local'
on conflict do nothing;

insert into public.user_church_links (user_id, church_id, role_id, can_be_scheduled, is_manager, notes)
select u.id, c.id, r.id, true, false, 'Disponivel para teste de escala.'
from public.users u
join public.churches c on c.name = 'IASD Central de Candido Sales'
join public.roles r on r.key = 'pregador'
where u.email = 'ana.pregadora@iasd.local'
on conflict do nothing;

insert into public.user_church_links (user_id, church_id, role_id, can_be_scheduled, is_manager, notes)
select u.id, c.id, r.id, true, true, 'Gerencia musica nesta igreja.'
from public.users u
join public.churches c on c.name = 'IASD Primavera'
join public.roles r on r.key = 'lider_musica'
where u.email = 'carlos.musica@iasd.local'
on conflict do nothing;

insert into public.settings (key, value, description)
values
  ('sistema.nome', '{"valor": "ESCALA IASD CANDIDO SALES"}', 'Nome exibido no sistema.'),
  ('pwa.instalacao', '{"android": true, "ios": true}', 'Configuracao inicial de instalacao PWA.'),
  ('acesso.aprovacao_manual', '{"ativo": true}', 'Novos usuarios aguardam aprovacao.')
on conflict (key) do update
set value = excluded.value,
    description = excluded.description,
    updated_at = now(),
    deleted_at = null;

insert into public.notifications (user_id, title, body, metadata)
select u.id,
       'Cadastro aprovado',
       'Este e um exemplo de notificacao basica para validacao inicial.',
       '{"origem": "seed"}'::jsonb
from public.users u
where u.email = 'ana.pregadora@iasd.local'
on conflict do nothing;

insert into public.history (actor_user_id, entity_table, entity_id, action, details)
select admin_user.id,
       'users',
       target_user.id,
       'seed.created',
       '{"descricao": "Usuario ficticio criado para testes."}'::jsonb
from public.users admin_user
join public.users target_user on target_user.email = 'ana.pregadora@iasd.local'
where admin_user.email = 'admin@iasd.local';
