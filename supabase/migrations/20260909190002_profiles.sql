-- ─────────────────────────────────────────────────────────────
-- profiles
-- يمتد من auth.users (Supabase Auth) — لا نخزّن كلمات المرور هنا إطلاقًا.
-- ─────────────────────────────────────────────────────────────

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null check (char_length(trim(full_name)) > 0),
  phone text not null,
  gender public.gender_type,
  address text,
  avatar_url text,
  role public.user_role not null default 'USER',
  status public.account_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'ملف موحّد لكل أنواع المستخدمين (USER/DOCTOR/NURSE/ADMIN). role يُحدَّد فقط عبر Trigger أو RPC آمن — ممنوع تعديله مباشرة من العميل (راجع RLS في المرحلة 5).';

create unique index profiles_phone_key on public.profiles (phone);

create index profiles_role_idx on public.profiles (role);
create index profiles_status_idx on public.profiles (status);

-- ─────────────────────────────────────────────────────────────
-- إنشاء profile تلقائيًا عند تسجيل حساب جديد في auth.users.
-- role يُفرض دائمًا كـ 'USER' هنا بغض النظر عن أي بيانات يرسلها العميل —
-- هذا هو الحاجز الأول (الحاجز الثاني هو RLS في المرحلة 5) اللي يمنع
-- أي مستخدم من تحويل نفسه لـ ADMIN/DOCTOR/NURSE عبر التسجيل العادي.
-- حسابات DOCTOR/NURSE تُنشأ فقط عبر RPC خاص بالـ Admin (migration الدوال).
-- ─────────────────────────────────────────────────────────────
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, gender, address)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'phone', ''),
    nullif(new.raw_user_meta_data ->> 'gender', '')::public.gender_type,
    new.raw_user_meta_data ->> 'address'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- تحديث updated_at تلقائيًا — دالة عامة تُعاد استخدامها في كل الجداول
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();
