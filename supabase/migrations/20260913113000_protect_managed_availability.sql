-- Impede que o navegador forje uma disponibilidade atribuida por gestor.

drop policy if exists "disponibilidade gerenciada pelo proprio usuario ou admin"
  on public.user_availability;

create policy "disponibilidade gerenciada pelo proprio usuario ou admin"
  on public.user_availability for all
  to authenticated
  using (
    deleted_at is null
    and (
      user_id = public.current_app_user_id()
      or public.is_admin()
    )
  )
  with check (
    deleted_at is null
    and (
      public.is_admin()
      or (
        user_id = public.current_app_user_id()
        and managed is false
        and managed_by_user_id is null
      )
    )
  );
