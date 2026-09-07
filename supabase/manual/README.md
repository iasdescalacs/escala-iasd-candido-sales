# Scripts Manuais do Banco

Estes scripts devem ser executados somente por alguem com acesso administrativo ao banco Supabase.

## Promover Administrador

```bash
psql "$DATABASE_URL" -v admin_email='email@dominio.com' -f supabase/manual/promote-admin.sql
```

## Recuperar Administrador

```bash
psql "$DATABASE_URL" -v admin_email='email@dominio.com' -f supabase/manual/recover-admin.sql
```

## Limpar Banco Mantendo Admin

```bash
psql "$DATABASE_URL" -v admin_email='email@dominio.com' -f supabase/manual/reset-keep-admin.sql
```

Revise o conteudo antes de executar scripts destrutivos.
