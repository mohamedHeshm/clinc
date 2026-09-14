-- ─────────────────────────────────────────────────────────────
-- availability
-- provider_id مرجع polymorphic (يشير لـ doctors.id أو nurses.id حسب
-- provider_type) لذلك لا يوجد FK مباشر — الحماية عبر trigger تحقق أدناه.
-- day_of_week: 0=الأحد .. 6=السبت (متوافق مع extract(dow from date) في Postgres)
-- ─────────────────────────────────────────────────────────────

create table public.availability (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null,
  provider_type public.provider_kind not null,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint availability_valid_range check (end_time > start_time),
  constraint availability_unique_slot unique (provider_id, provider_type, day_of_week, start_time)
);

create index availability_provider_idx on public.availability (provider_id, provider_type);

create trigger availability_set_updated_at
  before update on public.availability
  for each row execute function public.set_updated_at();

-- تحقق أن provider_id فعلًا موجود في الجدول المطابق لـ provider_type
create or replace function public.enforce_availability_provider_exists()
returns trigger
language plpgsql
as $$
begin
  if new.provider_type = 'doctor' then
    if not exists (select 1 from public.doctors where id = new.provider_id) then
      raise exception 'لا يوجد طبيب بالمعرّف %', new.provider_id;
    end if;
  else
    if not exists (select 1 from public.nurses where id = new.provider_id) then
      raise exception 'لا يوجد ممرض بالمعرّف %', new.provider_id;
    end if;
  end if;
  return new;
end;
$$;

create trigger availability_enforce_provider
  before insert or update on public.availability
  for each row execute function public.enforce_availability_provider_exists();
