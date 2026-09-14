-- ─────────────────────────────────────────────────────────────
-- is_admin() — دالة مساعدة تُستخدم هنا وفي RLS policies (المرحلة 5)
-- ─────────────────────────────────────────────────────────────
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'ADMIN'
  );
$$;

-- ─────────────────────────────────────────────────────────────
-- get_available_slots — يولّد الأوقات المتاحة الفعلية لمقدّم خدمة في يوم
-- معيّن بناءً على availability + الحجوزات النشطة الموجودة فعلًا.
-- هذا ما يغذّي واجهة "10:00 متاح / 11:00 محجوز" في قسم 14 بالمواصفة.
-- ─────────────────────────────────────────────────────────────
create or replace function public.get_available_slots(
  p_provider_id uuid,
  p_provider_type public.provider_kind,
  p_date date,
  p_slot_minutes integer default 60
)
returns table (slot_start time, slot_end time, is_available boolean)
language plpgsql
stable
as $$
declare
  dow smallint := extract(dow from p_date);
  avail record;
  cur_start time;
  cur_end time;
begin
  for avail in
    select a.start_time, a.end_time
    from public.availability a
    where a.provider_id = p_provider_id
      and a.provider_type = p_provider_type
      and a.day_of_week = dow
      and a.is_available
    order by a.start_time
  loop
    cur_start := avail.start_time;
    while cur_start + make_interval(mins => p_slot_minutes) <= avail.end_time loop
      cur_end := cur_start + make_interval(mins => p_slot_minutes);

      slot_start := cur_start;
      slot_end := cur_end;
      is_available := not exists (
        select 1 from public.bookings b
        where b.provider_id = p_provider_id
          and b.provider_type = p_provider_type
          and b.booking_date = p_date
          and b.status in ('pending', 'accepted', 'confirmed', 'in_progress')
          and b.start_time < cur_end
          and b.end_time > cur_start
      );
      return next;

      cur_start := cur_end;
    end loop;
  end loop;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- create_booking — نقطة الإدراج الوحيدة الموصى بها من الواجهة.
-- الحماية الحقيقية ضد الـ Race Condition هي bookings_no_double_booking
-- (exclusion constraint في المرحلة السابقة) — هذه الدالة فقط تلتقط
-- الخطأ وتحوّله لرسالة عربية واضحة بدل رمي PostgreSQL error خام
-- للمستخدم (قسم 55/58 في المواصفة).
-- ─────────────────────────────────────────────────────────────
create or replace function public.create_booking(
  p_provider_id uuid,
  p_provider_type public.provider_kind,
  p_service_id uuid,
  p_date date,
  p_start time,
  p_end time,
  p_price numeric,
  p_notes text default null
)
returns public.bookings
language plpgsql
as $$
declare
  new_booking public.bookings;
begin
  insert into public.bookings (
    patient_id, provider_id, provider_type, service_id,
    booking_date, start_time, end_time, price, notes
  ) values (
    auth.uid(), p_provider_id, p_provider_type, p_service_id,
    p_date, p_start, p_end, p_price, p_notes
  )
  returning * into new_booking;

  return new_booking;
exception
  when exclusion_violation then
    raise exception 'عذرًا، هذا الموعد لم يعد متاحًا. برجاء اختيار موعد آخر.'
      using errcode = '23P01';
end;
$$;

comment on function public.create_booking is 'استدعِها دائمًا من الواجهة بدل insert مباشر على bookings — بتلتقط تعارض المواعيد وتترجمه لرسالة عربية.';

-- ─────────────────────────────────────────────────────────────
-- admin_create_doctor / admin_create_nurse
-- يفترضان أن Auth account + profile (role=USER افتراضيًا) تم إنشاؤهم
-- بالفعل عبر Supabase Admin API (Edge Function بصلاحية service_role —
-- راجع تعليمات README قسم "إنشاء حساب طبيب/ممرض"). هذه الدالة ترقّي
-- الـ profile للدور الصحيح وتُنشئ صفّه المتخصص، بشرط إن المستدعي أدمن.
-- ─────────────────────────────────────────────────────────────
create or replace function public.admin_create_doctor(
  p_profile_id uuid,
  p_specialization text,
  p_bio text,
  p_experience_years smallint,
  p_clinic_address text,
  p_clinic_latitude double precision,
  p_clinic_longitude double precision,
  p_consultation_price numeric
)
returns public.doctors
language plpgsql
security definer
set search_path = public
as $$
declare
  new_doctor public.doctors;
begin
  if not public.is_admin() then
    raise exception 'هذا الإجراء متاح فقط للمدير';
  end if;

  update public.profiles set role = 'DOCTOR' where id = p_profile_id;

  insert into public.doctors (
    profile_id, specialization, bio, experience_years,
    clinic_address, clinic_latitude, clinic_longitude, consultation_price
  ) values (
    p_profile_id, p_specialization, p_bio, coalesce(p_experience_years, 0),
    p_clinic_address, p_clinic_latitude, p_clinic_longitude, p_consultation_price
  )
  returning * into new_doctor;

  insert into public.admin_actions (admin_id, action_type, target_table, target_id, description)
  values (auth.uid(), 'create_doctor', 'doctors', new_doctor.id, format('أضاف طبيب جديد (%s)', p_specialization));

  return new_doctor;
end;
$$;

create or replace function public.admin_create_nurse(
  p_profile_id uuid,
  p_bio text,
  p_experience_years smallint,
  p_service_area text[],
  p_visit_price numeric
)
returns public.nurses
language plpgsql
security definer
set search_path = public
as $$
declare
  new_nurse public.nurses;
begin
  if not public.is_admin() then
    raise exception 'هذا الإجراء متاح فقط للمدير';
  end if;

  update public.profiles set role = 'NURSE' where id = p_profile_id;

  insert into public.nurses (profile_id, bio, experience_years, service_area, visit_price)
  values (p_profile_id, p_bio, coalesce(p_experience_years, 0), coalesce(p_service_area, '{}'), p_visit_price)
  returning * into new_nurse;

  insert into public.admin_actions (admin_id, action_type, target_table, target_id, description)
  values (auth.uid(), 'create_nurse', 'nurses', new_nurse.id, 'أضاف ممرض/ممرضة جديد');

  return new_nurse;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- admin_set_account_status — إيقاف/تفعيل أي حساب (USER/DOCTOR/NURSE)
-- لا يحذف أي بيانات — الحجوزات والتقييمات التاريخية تبقى كما هي (قسم 46)
-- ─────────────────────────────────────────────────────────────
create or replace function public.admin_set_account_status(
  p_profile_id uuid,
  p_status public.account_status
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  updated public.profiles;
begin
  if not public.is_admin() then
    raise exception 'هذا الإجراء متاح فقط للمدير';
  end if;

  update public.profiles set status = p_status where id = p_profile_id
  returning * into updated;

  insert into public.admin_actions (admin_id, action_type, target_table, target_id, description)
  values (
    auth.uid(),
    case p_status when 'suspended' then 'suspend_account' else 'activate_account' end,
    'profiles',
    p_profile_id,
    format('%s حساب %s', case p_status when 'suspended' then 'تم إيقاف' else 'تم تفعيل' end, updated.full_name)
  );

  return updated;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- admin_log_action — تُستخدم من الواجهة بعد أي تعديل إداري عام
-- (تغيير سعر، تخصص، عنوان، إلخ) لضمان تسجيله في سجل التدقيق
-- بدون الحاجة لدالة RPC منفصلة لكل حقل.
-- ─────────────────────────────────────────────────────────────
create or replace function public.admin_log_action(
  p_action_type text,
  p_target_table text,
  p_target_id uuid,
  p_description text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'هذا الإجراء متاح فقط للمدير';
  end if;

  insert into public.admin_actions (admin_id, action_type, target_table, target_id, description)
  values (auth.uid(), p_action_type, p_target_table, p_target_id, p_description);
end;
$$;
