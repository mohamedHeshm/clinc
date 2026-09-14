-- ─────────────────────────────────────────────────────────────
-- doctors
-- ─────────────────────────────────────────────────────────────

create table public.doctors (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles (id) on delete cascade,
  specialization text not null,
  bio text,
  experience_years smallint not null default 0 check (experience_years >= 0),
  clinic_address text not null,
  clinic_latitude double precision,
  clinic_longitude double precision,
  consultation_price numeric(10, 2) not null check (consultation_price >= 0),
  is_active boolean not null default true,
  rating_avg numeric(3, 2) not null default 0 check (rating_avg between 0 and 5),
  rating_count integer not null default 0 check (rating_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index doctors_specialization_idx on public.doctors (specialization);
create index doctors_is_active_idx on public.doctors (is_active);
create index doctors_rating_idx on public.doctors (rating_avg desc);

create trigger doctors_set_updated_at
  before update on public.doctors
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- nurses
-- ─────────────────────────────────────────────────────────────

create table public.nurses (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles (id) on delete cascade,
  bio text,
  experience_years smallint not null default 0 check (experience_years >= 0),
  service_area text[] not null default '{}',
  visit_price numeric(10, 2) not null check (visit_price >= 0),
  is_active boolean not null default true,
  rating_avg numeric(3, 2) not null default 0 check (rating_avg between 0 and 5),
  rating_count integer not null default 0 check (rating_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index nurses_is_active_idx on public.nurses (is_active);
create index nurses_rating_idx on public.nurses (rating_avg desc);
create index nurses_service_area_gin on public.nurses using gin (service_area);

create trigger nurses_set_updated_at
  before update on public.nurses
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- حاجز أمان إضافي: صف doctors/nurses لازم يشير لـ profile بنفس الدور.
-- (الحاجز الأساسي هو RPC الأدمن في migration الدوال، وده حاجز ثانٍ
-- يمنع أي إدراج مباشر خاطئ حتى لو تم تجاوز الـ RPC).
-- ─────────────────────────────────────────────────────────────
create or replace function public.enforce_provider_profile_role()
returns trigger
language plpgsql
as $$
declare
  expected_role public.user_role;
  actual_role public.user_role;
begin
  expected_role := case tg_table_name
    when 'doctors' then 'DOCTOR'::public.user_role
    when 'nurses' then 'NURSE'::public.user_role
  end;

  select role into actual_role from public.profiles where id = new.profile_id;

  if actual_role is null then
    raise exception 'profile_id % غير موجود', new.profile_id;
  end if;

  if actual_role <> expected_role then
    raise exception 'profile % دوره % وليس %، لا يمكن إضافته في جدول %',
      new.profile_id, actual_role, expected_role, tg_table_name;
  end if;

  return new;
end;
$$;

create trigger doctors_enforce_role
  before insert on public.doctors
  for each row execute function public.enforce_provider_profile_role();

create trigger nurses_enforce_role
  before insert on public.nurses
  for each row execute function public.enforce_provider_profile_role();
