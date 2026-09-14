-- ─────────────────────────────────────────────────────────────
-- notifications
-- ─────────────────────────────────────────────────────────────

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  message text not null,
  type public.notification_type not null,
  related_booking_id uuid references public.bookings (id) on delete set null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_user_unread_idx on public.notifications (user_id, is_read, created_at desc);

-- ─────────────────────────────────────────────────────────────
-- admin_actions — سجل تدقيق العمليات الإدارية (قسم 56)
-- ─────────────────────────────────────────────────────────────

create table public.admin_actions (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.profiles (id),
  action_type text not null,
  target_table text,
  target_id uuid,
  description text not null,
  created_at timestamptz not null default now()
);

create index admin_actions_admin_idx on public.admin_actions (admin_id, created_at desc);

-- ─────────────────────────────────────────────────────────────
-- إشعارات تلقائية عند إنشاء الحجز أو تغيّر حالته.
-- إنشاء الإشعار من قاعدة البيانات نفسها (مش من الـ Frontend) يضمن
-- إنه دايمًا يحصل حتى لو حصل تحديث للحجز من أي مصدر (RPC/Admin/إلخ)،
-- وSupabase Realtime هيبلّغ الواجهة فورًا لما يتم الإدراج في notifications.
-- SECURITY DEFINER ضروري: المريض هو من يُنشئ الحجز، لكن الإشعار لازم
-- يوصل لمقدّم الخدمة (profile مختلف تمامًا) — بدون SECURITY DEFINER كانت
-- RLS هتمنع إدراج إشعار لمستخدم غير auth.uid() الحالي.
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
  -- تحديد صاحب profile الخاص بمقدّم الخدمة (polymorphic lookup)
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
        values (new.patient_id, 'تم قبول طلبك', format('وافق %s على طلب الحجز', coalesce(provider_name, 'مقدّم الخدمة')), 'booking_accepted', new.id);
      when 'rejected' then
        insert into public.notifications (user_id, title, message, type, related_booking_id)
        values (new.patient_id, 'تم رفض الطلب', format('اعتذر %s عن هذا الطلب، برجاء اختيار موعد آخر', coalesce(provider_name, 'مقدّم الخدمة')), 'booking_rejected', new.id);
      when 'confirmed' then
        insert into public.notifications (user_id, title, message, type, related_booking_id)
        values (new.patient_id, 'تم تأكيد الحجز', 'تم تأكيد موعدك بنجاح', 'booking_confirmed', new.id);
      when 'cancelled' then
        insert into public.notifications (user_id, title, message, type, related_booking_id)
        values (provider_profile_id, 'تم إلغاء الحجز', format('ألغى %s هذا الحجز', coalesce(patient_name, 'المستخدم')), 'booking_cancelled', new.id);
      when 'completed' then
        insert into public.notifications (user_id, title, message, type, related_booking_id)
        values (new.patient_id, 'اكتملت الخدمة', 'يمكنك الآن تقييم تجربتك', 'review_available', new.id);
      else
        null;
    end case;
  end if;

  return new;
end;
$$;

create trigger bookings_notify_on_insert
  after insert on public.bookings
  for each row execute function public.notify_booking_event();

create trigger bookings_notify_on_status_change
  after update of status on public.bookings
  for each row execute function public.notify_booking_event();
