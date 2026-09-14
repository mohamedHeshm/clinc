-- ─────────────────────────────────────────────────────────────
-- قاعدة جديدة صارمة: لا يمكن إلغاء حجز "pending" إطلاقًا — لا من
-- المريض ولا من الطبيب/الممرض ولا حتى بمحاولة إرسال UPDATE مباشر
-- متجاوزًا الواجهة. الإلغاء يصبح متاحًا فقط بعد قبول الحجز (accepted)
-- أو تأكيده (confirmed). هذا يستبدل enforce_booking_status_transition
-- و enforce_booking_actor_permission بنسخة أحدث (نفس أسماء الدوال
-- والجداول والأعمدة — بدون أي تغيير في الـSchema).
-- ─────────────────────────────────────────────────────────────

create or replace function public.enforce_booking_status_transition()
returns trigger
language plpgsql
as $$
declare
  allowed boolean := false;
begin
  if new.status = old.status then
    return new;
  end if;

  allowed := (old.status, new.status) in (
    ('pending', 'accepted'),
    ('pending', 'rejected'),
    -- تم حذف ('pending', 'cancelled') عمدًا: لا يمكن إلغاء حجز لسه
    -- بانتظار رد الطبيب/الممرض — قاعدة صريحة مطلوبة.
    ('accepted', 'confirmed'),
    ('accepted', 'cancelled'),
    ('confirmed', 'in_progress'),
    ('confirmed', 'cancelled'),
    ('in_progress', 'completed')
  );

  if not allowed then
    raise exception 'انتقال حالة غير مسموح: % → %', old.status, new.status;
  end if;

  return new;
end;
$$;

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

  -- انتقالات مقدّم الخدمة (قبول/رفض/تأكيد/بدء/إنهاء)
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

  -- الإلغاء: مسموح للمريض أو مقدّم الخدمة، وفقط من accepted/confirmed
  -- (pending مستبعدة تمامًا — لا يوجد طرف يقدر يلغي حجزًا لسه معلَّق)
  if new.status = 'cancelled' and old.status in ('accepted', 'confirmed') then
    if auth.uid() = new.patient_id or auth.uid() = provider_profile_id then
      return new;
    end if;
    raise exception 'غير مصرَّح بإلغاء هذا الحجز';
  end if;

  raise exception 'غير مصرَّح بهذا الإجراء';
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- إصلاح: إشعار الإلغاء كان دايمًا بيروح لمقدّم الخدمة حتى لو هو
-- نفسه اللي ألغى (لأن الإلغاء دلوقتي بقى متاح للطرفين). بقى بيحدّد
-- الطرف اللي *لم يقم* بالإلغاء ويبعتله الإشعار المناسب.
-- ─────────────────────────────────────────────────────────────

create or replace function public.notify_booking_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  provider_profile_id uuid;
  provider_name text;
  patient_name text;
begin
  if new.provider_type = 'doctor' then
    select p.id, p.full_name into provider_profile_id, provider_name
    from public.doctors d join public.profiles p on p.id = d.profile_id
    where d.id = new.provider_id;
  else
    select p.id, p.full_name into provider_profile_id, provider_name
    from public.nurses n join public.profiles p on p.id = n.profile_id
    where n.id = new.provider_id;
  end if;

  select full_name into patient_name from public.profiles where id = new.patient_id;

  if tg_op = 'INSERT' then
    insert into public.notifications (user_id, title, message, type, related_booking_id)
    values (
      provider_profile_id,
      'طلب حجز جديد',
      format('لديك طلب جديد من %s', coalesce(patient_name, 'مستخدم')),
      'booking_requested',
      new.id
    );
    return new;
  end if;

  if tg_op = 'UPDATE' and new.status <> old.status then
    case new.status
      when 'accepted' then
        insert into public.notifications (user_id, title, message, type, related_booking_id)
        values (new.patient_id, 'تم تأكيد الموعد', format('وافق %s على طلب حجزك', coalesce(provider_name, 'مقدّم الخدمة')), 'booking_accepted', new.id);
      when 'rejected' then
        insert into public.notifications (user_id, title, message, type, related_booking_id)
        values (new.patient_id, 'تم رفض طلب الحجز', format('اعتذر %s عن هذا الطلب، برجاء اختيار موعد آخر', coalesce(provider_name, 'مقدّم الخدمة')), 'booking_rejected', new.id);
      when 'confirmed' then
        insert into public.notifications (user_id, title, message, type, related_booking_id)
        values (new.patient_id, 'تم تأكيد الموعد', 'تم تأكيد موعدك بنجاح', 'booking_confirmed', new.id);
      when 'cancelled' then
        -- نبلّغ الطرف اللي *لم* يلغِ الحجز (بغض النظر مين منهم فعلها)
        if auth.uid() = new.patient_id then
          insert into public.notifications (user_id, title, message, type, related_booking_id)
          values (provider_profile_id, 'تم إلغاء الحجز', format('ألغى %s هذا الحجز', coalesce(patient_name, 'المستخدم')), 'booking_cancelled', new.id);
        else
          insert into public.notifications (user_id, title, message, type, related_booking_id)
          values (new.patient_id, 'تم إلغاء الموعد', format('ألغى %s هذا الموعد', coalesce(provider_name, 'مقدّم الخدمة')), 'booking_cancelled', new.id);
        end if;
      when 'completed' then
        insert into public.notifications (user_id, title, message, type, related_booking_id)
        values (new.patient_id, 'اكتمل الموعد', 'يمكنك الآن تقييم تجربتك', 'review_available', new.id);
      else
        null;
    end case;
  end if;

  return new;
end;
$$;
