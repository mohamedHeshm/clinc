-- ─────────────────────────────────────────────────────────────
-- المرحلة 11 — Provider Dashboards تحتاج تعرض اسم المريض ورقم هاتفه
-- في تفاصيل كل طلب/حجز (قسم 19/20 بالمواصفة). سياسة profiles الحالية
-- (المرحلة 5) بتسمح للمستخدم بصفّه بس — نضيف هنا استثناء دقيق:
-- الطبيب/الممرض يقدر يشوف صف profile المريض فقط لو عنده حجز فعلي
-- معاه (بغض النظر عن حالة الحجز)، مش أي مستخدم عشوائي في النظام.
-- ─────────────────────────────────────────────────────────────

create policy profiles_select_by_provider
  on public.profiles for select
  using (
    exists (
      select 1 from public.bookings b
      where b.patient_id = profiles.id
        and (
          (b.provider_type = 'doctor' and b.provider_id in (select id from public.doctors where profile_id = auth.uid()))
          or (b.provider_type = 'nurse' and b.provider_id in (select id from public.nurses where profile_id = auth.uid()))
        )
    )
  );
