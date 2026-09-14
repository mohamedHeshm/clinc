-- ─────────────────────────────────────────────────────────────
-- السماح للطبيب/الممرض بإدارة خدماته وأسعاره الخاصة (اللي تظهر
-- للمريض في ملفه الشخصي وأثناء الحجز) — بدل ما يكون الأدمن بس
-- هو اللي يتحكم في ده. القراءة العامة (doctor_services_select_public/
-- nurse_services_select_public) موجودة بالفعل من المرحلة 5.
-- ─────────────────────────────────────────────────────────────

drop policy if exists nurse_services_write_own on public.nurse_services;
create policy nurse_services_write_own
  on public.nurse_services for all
  using (
    public.is_admin()
    or exists (
      select 1 from public.nurses n
      where n.id = nurse_services.nurse_id and n.profile_id = auth.uid()
    )
  )
  with check (
    public.is_admin()
    or exists (
      select 1 from public.nurses n
      where n.id = nurse_services.nurse_id and n.profile_id = auth.uid()
    )
  );

drop policy if exists doctor_services_write_own on public.doctor_services;
create policy doctor_services_write_own
  on public.doctor_services for all
  using (
    public.is_admin()
    or exists (
      select 1 from public.doctors d
      where d.id = doctor_services.doctor_id and d.profile_id = auth.uid()
    )
  )
  with check (
    public.is_admin()
    or exists (
      select 1 from public.doctors d
      where d.id = doctor_services.doctor_id and d.profile_id = auth.uid()
    )
  );
