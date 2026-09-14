-- ═══════════════════════════════════════════════════════════════
-- المرحلة 5 — Row Level Security
-- من هنا فصاعدًا، RLS هي خط الدفاع الحقيقي — الواجهة (ProtectedRoute)
-- مجرد تجربة مستخدم، وأي شيء ممنوع هنا ممنوع فعليًا حتى لو تم تجاوز
-- الواجهة بالكامل واستُخدم الـ anon/authenticated key مباشرة.
-- ═══════════════════════════════════════════════════════════════

alter table public.profiles enable row level security;
alter table public.doctors enable row level security;
alter table public.nurses enable row level security;
alter table public.services enable row level security;
alter table public.doctor_services enable row level security;
alter table public.nurse_services enable row level security;
alter table public.availability enable row level security;
alter table public.bookings enable row level security;
alter table public.locations enable row level security;
alter table public.reviews enable row level security;
alter table public.notifications enable row level security;
alter table public.admin_actions enable row level security;

-- ─────────────────────────────────────────────────────────────
-- profiles
-- ─────────────────────────────────────────────────────────────

create policy profiles_select_own
  on public.profiles for select
  using (id = auth.uid() or public.is_admin());

create policy profiles_update_own
  on public.profiles for update
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- لا توجد policy لـ insert: الإدراج فقط عبر trigger handle_new_auth_user
-- (SECURITY DEFINER) — العميل لا يقدر يعمل insert مباشر على profiles إطلاقًا.
-- لا توجد policy لـ delete: لا حذف مباشر للحسابات (Suspend فقط، قسم 46).

-- حماية عمود role/status من التعديل المباشر حتى لو الصف بتاع المستخدم نفسه.
-- role يتغيّر فقط عبر admin_create_doctor/admin_create_nurse (RPC، SECURITY DEFINER).
-- status يتغيّر فقط عبر admin_set_account_status (RPC، SECURITY DEFINER).
create or replace function public.protect_profile_sensitive_columns()
returns trigger
language plpgsql
as $$
begin
  if public.is_admin() then
    return new;
  end if;

  if new.role <> old.role then
    raise exception 'لا يمكنك تغيير نوع حسابك';
  end if;

  if new.status <> old.status then
    raise exception 'لا يمكنك تغيير حالة حسابك';
  end if;

  return new;
end;
$$;

create trigger profiles_protect_sensitive_columns
  before update on public.profiles
  for each row execute function public.protect_profile_sensitive_columns();

-- ─────────────────────────────────────────────────────────────
-- doctors / nurses
-- القراءة العامة مقصورة على الأطباء/الممرضين النشطين (تصفح عام بلا تسجيل
-- دخول — قسم 10/12)، مع سماح كامل لصاحب الحساب ولـ Admin.
-- ─────────────────────────────────────────────────────────────

create policy doctors_select_public
  on public.doctors for select
  using (
    is_active
    or public.is_admin()
    or profile_id = auth.uid()
  );

create policy doctors_update_own_or_admin
  on public.doctors for update
  using (profile_id = auth.uid() or public.is_admin())
  with check (profile_id = auth.uid() or public.is_admin());

create policy nurses_select_public
  on public.nurses for select
  using (
    is_active
    or public.is_admin()
    or profile_id = auth.uid()
  );

create policy nurses_update_own_or_admin
  on public.nurses for update
  using (profile_id = auth.uid() or public.is_admin())
  with check (profile_id = auth.uid() or public.is_admin());

-- لا policy لـ insert/delete: الإنشاء فقط عبر admin_create_doctor/admin_create_nurse
-- (SECURITY DEFINER تعمل بصلاحية مالك الجدول فتتخطى RLS بشكل مقصود وآمن).

-- تقييد الحقول القابلة للتعديل ذاتيًا (الطبيب/الممرض) مقابل ما يملكه Admin فقط
-- (السعر، التخصص، الحالة، سنوات الخبرة، التقييم — قسم 29/30: "تغيير السعر" إداري).
create or replace function public.enforce_doctor_self_edit_columns()
returns trigger
language plpgsql
as $$
begin
  if public.is_admin() then
    return new;
  end if;

  if new.specialization <> old.specialization
     or new.experience_years <> old.experience_years
     or new.consultation_price <> old.consultation_price
     or new.is_active <> old.is_active
     or new.rating_avg <> old.rating_avg
     or new.rating_count <> old.rating_count then
    raise exception 'هذا الحقل قابل للتعديل من الأدمن فقط';
  end if;

  return new;
end;
$$;

create trigger doctors_enforce_self_edit_columns
  before update on public.doctors
  for each row execute function public.enforce_doctor_self_edit_columns();

create or replace function public.enforce_nurse_self_edit_columns()
returns trigger
language plpgsql
as $$
begin
  if public.is_admin() then
    return new;
  end if;

  if new.experience_years <> old.experience_years
     or new.visit_price <> old.visit_price
     or new.is_active <> old.is_active
     or new.rating_avg <> old.rating_avg
     or new.rating_count <> old.rating_count then
    raise exception 'هذا الحقل قابل للتعديل من الأدمن فقط';
  end if;

  return new;
end;
$$;

create trigger nurses_enforce_self_edit_columns
  before update on public.nurses
  for each row execute function public.enforce_nurse_self_edit_columns();

-- ─────────────────────────────────────────────────────────────
-- services / doctor_services / nurse_services
-- كتالوج عام للقراءة، وإدارة بواسطة Admin فقط (قسم 13).
-- ─────────────────────────────────────────────────────────────

create policy services_select_public
  on public.services for select
  using (is_active or public.is_admin());

create policy services_admin_write
  on public.services for all
  using (public.is_admin())
  with check (public.is_admin());

create policy doctor_services_select_public
  on public.doctor_services for select
  using (true);

create policy doctor_services_admin_write
  on public.doctor_services for all
  using (public.is_admin())
  with check (public.is_admin());

create policy nurse_services_select_public
  on public.nurse_services for select
  using (true);

create policy nurse_services_admin_write
  on public.nurse_services for all
  using (public.is_admin())
  with check (public.is_admin());

-- ─────────────────────────────────────────────────────────────
-- availability
-- قراءة عامة (لازمة لحساب الأوقات المتاحة حتى لغير المسجَّلين أثناء
-- التصفح)، وكتابة فقط من صاحب الحساب أو Admin.
-- ─────────────────────────────────────────────────────────────

create policy availability_select_public
  on public.availability for select
  using (true);

create policy availability_write_own_or_admin
  on public.availability for all
  using (
    public.is_admin()
    or (
      provider_type = 'doctor'
      and provider_id in (select id from public.doctors where profile_id = auth.uid())
    )
    or (
      provider_type = 'nurse'
      and provider_id in (select id from public.nurses where profile_id = auth.uid())
    )
  )
  with check (
    public.is_admin()
    or (
      provider_type = 'doctor'
      and provider_id in (select id from public.doctors where profile_id = auth.uid())
    )
    or (
      provider_type = 'nurse'
      and provider_id in (select id from public.nurses where profile_id = auth.uid())
    )
  );

-- ─────────────────────────────────────────────────────────────
-- bookings
-- ─────────────────────────────────────────────────────────────

create policy bookings_select_involved
  on public.bookings for select
  using (
    patient_id = auth.uid()
    or public.is_admin()
    or (
      provider_type = 'doctor'
      and provider_id in (select id from public.doctors where profile_id = auth.uid())
    )
    or (
      provider_type = 'nurse'
      and provider_id in (select id from public.nurses where profile_id = auth.uid())
    )
  );

create policy bookings_insert_own
  on public.bookings for insert
  with check (patient_id = auth.uid());

create policy bookings_update_involved
  on public.bookings for update
  using (
    patient_id = auth.uid()
    or public.is_admin()
    or (
      provider_type = 'doctor'
      and provider_id in (select id from public.doctors where profile_id = auth.uid())
    )
    or (
      provider_type = 'nurse'
      and provider_id in (select id from public.nurses where profile_id = auth.uid())
    )
  )
  with check (
    patient_id = auth.uid()
    or public.is_admin()
    or (
      provider_type = 'doctor'
      and provider_id in (select id from public.doctors where profile_id = auth.uid())
    )
    or (
      provider_type = 'nurse'
      and provider_id in (select id from public.nurses where profile_id = auth.uid())
    )
  );

-- من يقدر "يعمل" الانتقال ده فعليًا (قبول/رفض بواسطة المزوّد، إلغاء بواسطة
-- المريض، أي شيء بواسطة الأدمن) — مكمّلة لـ enforce_booking_status_transition
-- اللي بتتحقق من "منطقية" الانتقال نفسه بغض النظر عن الفاعل.
create or replace function public.enforce_booking_actor_permission()
returns trigger
language plpgsql
as $$
declare
  provider_profile_id uuid;
begin
  if public.is_admin() then
    return new;
  end if;

  if new.status = old.status then
    return new;
  end if;

  if new.provider_type = 'doctor' then
    select profile_id into provider_profile_id from public.doctors where id = new.provider_id;
  else
    select profile_id into provider_profile_id from public.nurses where id = new.provider_id;
  end if;

  if (old.status, new.status) in (
    ('pending', 'accepted'),
    ('pending', 'rejected'),
    ('accepted', 'confirmed'),
    ('confirmed', 'in_progress'),
    ('in_progress', 'completed')
  ) then
    if auth.uid() <> provider_profile_id then
      raise exception 'غير مصرَّح بتغيير حالة هذا الحجز';
    end if;
    return new;
  end if;

  if new.status = 'cancelled' and old.status in ('pending', 'accepted', 'confirmed') then
    if auth.uid() <> new.patient_id then
      raise exception 'غير مصرَّح بإلغاء هذا الحجز';
    end if;
    return new;
  end if;

  raise exception 'غير مصرَّح بهذا الإجراء';
end;
$$;

create trigger bookings_enforce_actor_permission
  before update of status on public.bookings
  for each row execute function public.enforce_booking_actor_permission();

-- سد ثغرة إضافية: RLS أعلاه بتتحقق من "مين يقدر يوصل للصف"، لكن مش بتمنع
-- المريض/المزوّد من تعديل أعمدة تانية غير status/notes (زي السعر أو التاريخ)
-- عبر UPDATE عادي. هذا الـ trigger يمنع أي تعديل على أي عمود تاني غير
-- status و notes من طرف غير الأدمن.
create or replace function public.enforce_booking_field_restrictions()
returns trigger
language plpgsql
as $$
begin
  if public.is_admin() then
    return new;
  end if;

  if new.patient_id <> old.patient_id
     or new.provider_id <> old.provider_id
     or new.provider_type <> old.provider_type
     or new.service_id is distinct from old.service_id
     or new.booking_date <> old.booking_date
     or new.start_time <> old.start_time
     or new.end_time <> old.end_time
     or new.price <> old.price then
    raise exception 'لا يمكن تعديل تفاصيل الحجز الأساسية — أنشئ حجزًا جديدًا بدلًا من ذلك';
  end if;

  return new;
end;
$$;

create trigger bookings_enforce_field_restrictions
  before update on public.bookings
  for each row execute function public.enforce_booking_field_restrictions();

-- ─────────────────────────────────────────────────────────────
-- locations
-- ─────────────────────────────────────────────────────────────

create policy locations_select_involved
  on public.locations for select
  using (
    public.is_admin()
    or exists (
      select 1 from public.bookings b
      where b.id = locations.booking_id
        and (
          b.patient_id = auth.uid()
          or (b.provider_type = 'doctor' and b.provider_id in (select id from public.doctors where profile_id = auth.uid()))
          or (b.provider_type = 'nurse' and b.provider_id in (select id from public.nurses where profile_id = auth.uid()))
        )
    )
  );

create policy locations_insert_own_booking
  on public.locations for insert
  with check (
    exists (
      select 1 from public.bookings b
      where b.id = locations.booking_id and b.patient_id = auth.uid()
    )
  );

create policy locations_update_own_booking
  on public.locations for update
  using (
    exists (
      select 1 from public.bookings b
      where b.id = locations.booking_id and b.patient_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.bookings b
      where b.id = locations.booking_id and b.patient_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────
-- reviews — القراءة عامة (تظهر في صفحات الأطباء/الممرضين العامة)
-- ─────────────────────────────────────────────────────────────

create policy reviews_select_public
  on public.reviews for select
  using (true);

create policy reviews_insert_own
  on public.reviews for insert
  with check (user_id = auth.uid());

-- لا update/delete: التقييم نهائي بعد إرساله.

-- ─────────────────────────────────────────────────────────────
-- notifications
-- ─────────────────────────────────────────────────────────────

create policy notifications_select_own
  on public.notifications for select
  using (user_id = auth.uid() or public.is_admin());

create policy notifications_update_own
  on public.notifications for update
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

-- المستخدم يقدر يعدّل is_read فقط، مش أي عمود تاني (title/message/type...)
create or replace function public.enforce_notification_read_only_field()
returns trigger
language plpgsql
as $$
begin
  if public.is_admin() then
    return new;
  end if;

  if new.title <> old.title or new.message <> old.message or new.type <> old.type
     or new.related_booking_id is distinct from old.related_booking_id then
    raise exception 'يمكنك فقط تحديث حالة القراءة';
  end if;

  return new;
end;
$$;

create trigger notifications_enforce_read_only_field
  before update on public.notifications
  for each row execute function public.enforce_notification_read_only_field();

-- لا insert policy للعميل: الإشعارات تُنشأ فقط عبر trigger notify_booking_event
-- (SECURITY DEFINER).

-- ─────────────────────────────────────────────────────────────
-- admin_actions — قراءة/كتابة Admin فقط (سجل تدقيق)
-- ─────────────────────────────────────────────────────────────

create policy admin_actions_admin_only
  on public.admin_actions for all
  using (public.is_admin())
  with check (public.is_admin());

-- ═══════════════════════════════════════════════════════════════
-- Views عامة للتصفح بدون تسجيل دخول (Doctors Page / Nurses Page)
-- تكشف فقط الحقول الآمنة من profiles (الاسم والصورة)، وليس كل الصف
-- (الهاتف عمدًا غير موجود هنا). الـ Views بتشتغل بصلاحية مالكها
-- (postgres) فبتتخطى RLS الأساسية بشكل مقصود لعرض بيانات عامة منسّقة.
-- ═══════════════════════════════════════════════════════════════

create view public.doctors_public as
select
  d.id,
  p.full_name,
  p.avatar_url,
  p.gender,
  d.specialization,
  d.bio,
  d.experience_years,
  d.clinic_address,
  d.clinic_latitude,
  d.clinic_longitude,
  d.consultation_price,
  d.rating_avg,
  d.rating_count,
  exists (
    select 1 from public.availability a
    where a.provider_id = d.id
      and a.provider_type = 'doctor'
      and a.day_of_week = extract(dow from current_date)
      and a.is_available
  ) as available_today
from public.doctors d
join public.profiles p on p.id = d.profile_id
where d.is_active and p.status = 'active';

create view public.nurses_public as
select
  n.id,
  p.full_name,
  p.avatar_url,
  p.gender,
  n.bio,
  n.experience_years,
  n.service_area,
  n.visit_price,
  n.rating_avg,
  n.rating_count,
  exists (
    select 1 from public.availability a
    where a.provider_id = n.id
      and a.provider_type = 'nurse'
      and a.day_of_week = extract(dow from current_date)
      and a.is_available
  ) as available_today
from public.nurses n
join public.profiles p on p.id = n.profile_id
where n.is_active and p.status = 'active';

grant select on public.doctors_public to anon, authenticated;
grant select on public.nurses_public to anon, authenticated;
