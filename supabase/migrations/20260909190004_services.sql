-- ─────────────────────────────────────────────────────────────
-- services — قابلة للإدارة بالكامل من Admin (قسم 13 في المواصفة)
-- ─────────────────────────────────────────────────────────────

create table public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  applies_to public.provider_kind[] not null default array['doctor', 'nurse']::public.provider_kind[],
  default_price numeric(10, 2) check (default_price is null or default_price >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index services_name_key on public.services (lower(name));
create index services_is_active_idx on public.services (is_active);

create trigger services_set_updated_at
  before update on public.services
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- doctor_services — ربط N:N مع سعر اختياري يتجاوز default_price
-- ─────────────────────────────────────────────────────────────

create table public.doctor_services (
  doctor_id uuid not null references public.doctors (id) on delete cascade,
  service_id uuid not null references public.services (id) on delete cascade,
  price numeric(10, 2) check (price is null or price >= 0),
  created_at timestamptz not null default now(),
  primary key (doctor_id, service_id)
);

create index doctor_services_service_idx on public.doctor_services (service_id);

-- ─────────────────────────────────────────────────────────────
-- nurse_services
-- ─────────────────────────────────────────────────────────────

create table public.nurse_services (
  nurse_id uuid not null references public.nurses (id) on delete cascade,
  service_id uuid not null references public.services (id) on delete cascade,
  price numeric(10, 2) check (price is null or price >= 0),
  created_at timestamptz not null default now(),
  primary key (nurse_id, service_id)
);

create index nurse_services_service_idx on public.nurse_services (service_id);
