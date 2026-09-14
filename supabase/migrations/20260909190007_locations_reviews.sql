-- ─────────────────────────────────────────────────────────────
-- locations — لموقع الزيارة المنزلية فقط (bookings حيث provider_type='nurse')
-- ─────────────────────────────────────────────────────────────

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings (id) on delete cascade,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  address text not null,
  notes text,
  created_at timestamptz not null default now()
);

create index locations_booking_idx on public.locations (booking_id);

-- تأكيد إن الموقع بيتسجل فقط لحجوزات الممرضين (زيارة منزلية)
create or replace function public.enforce_location_for_nurse_booking()
returns trigger
language plpgsql
as $$
declare
  booking_provider_type public.provider_kind;
begin
  select provider_type into booking_provider_type
  from public.bookings where id = new.booking_id;

  if booking_provider_type <> 'nurse' then
    raise exception 'الموقع يُسجَّل فقط لحجوزات الزيارة المنزلية (ممرض)';
  end if;

  return new;
end;
$$;

create trigger locations_enforce_nurse_booking
  before insert on public.locations
  for each row execute function public.enforce_location_for_nurse_booking();

-- ─────────────────────────────────────────────────────────────
-- reviews
-- unique(booking_id) يمنع أكثر من تقييم واحد لنفس الحجز (قسم 24/41).
-- شروط الأهلية (booking مكتمل + المُقيِّم هو صاحب الحجز) مفروضة بـ trigger
-- تحت، مش بس RLS، عشان تبقى حماية حقيقية على مستوى البيانات.
-- ─────────────────────────────────────────────────────────────

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings (id) on delete cascade,
  user_id uuid not null references public.profiles (id),
  provider_id uuid not null,
  provider_type public.provider_kind not null,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

create index reviews_provider_idx on public.reviews (provider_id, provider_type);

create or replace function public.enforce_review_eligibility()
returns trigger
language plpgsql
as $$
declare
  b public.bookings%rowtype;
begin
  select * into b from public.bookings where id = new.booking_id;

  if b.id is null then
    raise exception 'الحجز غير موجود';
  end if;

  if b.status <> 'completed' then
    raise exception 'لا يمكن التقييم قبل اكتمال الخدمة';
  end if;

  if b.patient_id <> new.user_id then
    raise exception 'لا يمكنك تقييم حجز لا يخصّك';
  end if;

  if new.provider_id <> b.provider_id or new.provider_type <> b.provider_type then
    raise exception 'بيانات مقدّم الخدمة في التقييم لا تطابق الحجز';
  end if;

  return new;
end;
$$;

create trigger reviews_enforce_eligibility
  before insert on public.reviews
  for each row execute function public.enforce_review_eligibility();

-- تحديث متوسط وعدد التقييمات على doctors/nurses تلقائيًا بعد كل تقييم جديد.
-- SECURITY DEFINER ضروري هنا: المريض (وليس الطبيب) هو من يُدرج الـ Review،
-- وبالتالي هو من يُشغّل هذا الـ Trigger، لكنه لا يملك صلاحية UPDATE على
-- صف الطبيب تحت RLS العادية — الدالة تعمل بصلاحية مالكها (postgres) لتخطي
-- هذا القيد فقط لغرض تحديث الحقول المُجمَّعة (rating_avg/rating_count).
create or replace function public.refresh_provider_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.provider_type = 'doctor' then
    update public.doctors
    set rating_count = rating_count + 1,
        rating_avg = round(
          (((rating_avg * rating_count) + new.rating)::numeric / (rating_count + 1)), 2
        )
    where id = new.provider_id;
  else
    update public.nurses
    set rating_count = rating_count + 1,
        rating_avg = round(
          (((rating_avg * rating_count) + new.rating)::numeric / (rating_count + 1)), 2
        )
    where id = new.provider_id;
  end if;
  return new;
end;
$$;

create trigger reviews_refresh_provider_rating
  after insert on public.reviews
  for each row execute function public.refresh_provider_rating();
