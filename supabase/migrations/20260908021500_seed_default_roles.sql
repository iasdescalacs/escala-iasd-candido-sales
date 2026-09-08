-- Garante perfis padrao no banco remoto, sem depender do seed local.

insert into public.roles (key, name, description)
values
  ('admin', 'Administrador', 'Gerencia todo o sistema.'),
  ('anciao', 'Ancião', 'Gerencia pregadores das igrejas vinculadas.'),
  ('lider_musica', 'Líder de Música', 'Gerencia cantores e grupos das igrejas vinculadas.'),
  ('pregador', 'Pregador', 'Informa disponibilidade e acompanha agenda de pregações.'),
  ('cantor', 'Cantor', 'Informa disponibilidade e acompanha agenda musical.')
on conflict (key) do update
set name = excluded.name,
    description = excluded.description,
    updated_at = now(),
    deleted_at = null;
