-- ─────────────────────────────────────────────────────────────
-- قسم 25 بالمواصفة: "ممرضين قريبين مني" يحتاج نقطة مرجعية لموقع
-- الممرض الأساسي (منزله/منطقة انطلاقه) — الجدول الأصلي فيه service_area
-- (أسماء مناطق نصية) بس مفيش إحداثيات فعلية لحساب مسافة حقيقية.
-- هذا الموقع ثابت (يحدّده الأدمن أو الممرض نفسه) وليس تتبعًا حيًا
-- (نتجنّب أي Fake Tracking عمدًا — قسم 60 بالمواصفة).
-- ─────────────────────────────────────────────────────────────

alter table public.nurses
  add column base_latitude double precision,
  add column base_longitude double precision;

-- إعادة إنشاء nurses_public لإضافة الموقع الأساسي (اختياري) لحساب المسافة
drop view if exists public.nurses_public;

create view public.nurses_public as
select
  n.id,
  p.full_name,
  p.avatar_url,
  p.gender,
  n.bio,
  n.experience_years,
  n.service_area,
  n.base_latitude,
  n.base_longitude,
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

grant select on public.nurses_public to anon, authenticated;

-- تحديث admin_create_nurse لدعم تمرير الموقع الأساسي الاختياري وقت الإنشاء
-- (CREATE OR REPLACE آمن هنا لأنه بعد إضافة الأعمدة في نفس الملف)
create or replace function public.admin_create_nurse(
  p_profile_id uuid,
  p_bio text,
  p_experience_years smallint,
  p_service_area text[],
  p_visit_price numeric,
  p_base_latitude double precision default null,
  p_base_longitude double precision default null
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

  insert into public.nurses (
    profile_id, bio, experience_years, service_area, visit_price, base_latitude, base_longitude
  )
  values (
    p_profile_id, p_bio, coalesce(p_experience_years, 0), coalesce(p_service_area, '{}'),
    p_visit_price, p_base_latitude, p_base_longitude
  )
  returning * into new_nurse;

  insert into public.admin_actions (admin_id, action_type, target_table, target_id, description)
  values (auth.uid(), 'create_nurse', 'nurses', new_nurse.id, 'أضاف ممرض/ممرضة جديد');

  return new_nurse;
end;
$$;

-- السماح للممرض بتحديث موقعه الأساسي بنفسه (إضافة لقائمة الحقول المسموحة
-- في enforce_nurse_self_edit_columns من المرحلة 5 — الدالة بترفض أي عمود
-- مش من القايمة، فمحتاجين نحدّثها لإضافة base_latitude/base_longitude)
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
