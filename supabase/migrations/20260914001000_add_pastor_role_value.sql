-- Adiciona Pastor ao enum em uma transacao separada para uso seguro nas migrations seguintes.

alter type public.role_key add value if not exists 'pastor';
