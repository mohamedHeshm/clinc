-- ─────────────────────────────────────────────────────────────
-- bookings
-- جدول موحّد لحجوزات الأطباء وطلبات الزيارة المنزلية للممرضين معًا
-- (قرار هندسي موثّق في 01-architecture.md §4 — بديل appointments/booking_requests
-- المنفصلين في الطلب الأصلي، لتبسيط منع الـ Double Booking والـ Calendar).
-- ─────────────────────────────────────────────────────────────

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles (id),
  provider_id uuid not null,
  provider_type public.provider_kind not null,
  service_id uuid references public.services (id),

  booking_date date not null,
  start_time time not null,
  end_time time not null,

  -- عمود مُشتق تلقائيًا يُستخدم فقط لفرض منع التعارض الزمني (EXCLUDE أدناه)
  time_range tsrange generated always as (
    tsrange(
      (booking_date + start_time)::timestamp,
      (booking_date + end_time)::timestamp,
      '[)'
    )
  ) stored,

  price numeric(10, 2) not null check (price >= 0),
  status public.booking_status not null default 'pending',
  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint bookings_valid_time_range check (end_time > start_time),

  -- ─────────────────────────────────────────────────────────
  -- القلب الحقيقي لمنع الـ Double Booking، قسم 17/58 في المواصفة —
  -- لا يمكن أن يوجد صفّان لنفس (provider_id, provider_type) بفترتين
  -- زمنيتين متداخلتين طالما كلاهما في حالة "نشطة" (لسه ممكن تتأكد).
  -- هذا مفروض من PostgreSQL نفسه — أي محاولة إدراج متزامنة من طلبين
  -- مختلفين، واحد منهم فقط ينجح والآخر يفشل بخطأ exclusion_violation
  -- (تلتقطه الدالة create_booking أدناه وتحوّله لرسالة عربية واضحة).
  -- ─────────────────────────────────────────────────────────
  constraint bookings_no_double_booking exclude using gist (
    provider_id with =,
    provider_type with =,
    time_range with &&
  ) where (status in ('pending', 'accepted', 'confirmed', 'in_progress'))
);

create index bookings_patient_idx on public.bookings (patient_id);
create index bookings_provider_idx on public.bookings (provider_id, provider_type);
create index bookings_status_idx on public.bookings (status);
create index bookings_date_idx on public.bookings (booking_date);

comment on table public.bookings is 'حجز موحّد (طبيب أو ممرض). منع التعارض الزمني مفروض عبر bookings_no_double_booking exclusion constraint، وليس فقط منطق تطبيق.';
comment on constraint bookings_no_double_booking on public.bookings is 'يمنع تعارض المواعيد لنفس مقدم الخدمة على مستوى قاعدة البيانات مباشرة (race-condition safe).';

create trigger bookings_set_updated_at
  before update on public.bookings
  for each row execute function public.set_updated_at();

-- تحقق أن provider_id فعلًا موجود ونشط في الجدول المطابق
create or replace function public.enforce_booking_provider_exists()
returns trigger
language plpgsql
as $$
begin
  if new.provider_type = 'doctor' then
    if not exists (select 1 from public.doctors where id = new.provider_id and is_active) then
      raise exception 'مقدّم الخدمة غير متاح حاليًا';
    end if;
  else
    if not exists (select 1 from public.nurses where id = new.provider_id and is_active) then
      raise exception 'مقدّم الخدمة غير متاح حاليًا';
    end if;
  end if;
  return new;
end;
$$;

create trigger bookings_enforce_provider
  before insert on public.bookings
  for each row execute function public.enforce_booking_provider_exists();

-- ─────────────────────────────────────────────────────────────
-- آلة الحالة: يمنع أي انتقال غير منطقي حتى لو تم استدعاء update
-- مباشرة (وليس فقط من الواجهة) — راجع 01-architecture.md §5
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
    ('pending', 'cancelled'),
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

create trigger bookings_enforce_status_transition
  before update of status on public.bookings
  for each row execute function public.enforce_booking_status_transition();
