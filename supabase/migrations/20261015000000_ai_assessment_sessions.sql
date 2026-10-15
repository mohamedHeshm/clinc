-- ============================================================================
-- 0014_ai_assessment_sessions.sql
-- المساعد الصحي الذكي — جلسات تقييم الأعراض
--
-- قرارات تصميم مهمة (مُوثَّقة هنا لتبقى واضحة لأي مراجعة لاحقة):
--   1) لا نخزّن نص المحادثة الكامل (Full Chat Transcript) — فقط البيانات
--      المُهيكلة الناتجة (ملخص الأعراض، الإجابات المُهيكلة، التخصصات
--      المقترحة). هذا يقلّل من البيانات الطبية الحساسة المُخزَّنة فعليًا.
--   2) الجلسة مرتبطة دائمًا بمستخدم مسجّل دخوله (patient_id NOT NULL) —
--      لا جلسات مجهولة الهوية، لتفعيل Rate Limiting حقيقي ومنع إساءة
--      الاستخدام، ولتبسيط RLS (ملكية مباشرة فقط).
--   3) انتهاء صلاحية تلقائي (expires_at) — الجلسات القديمة تُعتبر منتهية
--      ولا تُستخدم لأي غرض بعد انقضاء مدتها (افتراضيًا 24 ساعة).
-- ============================================================================

do $$ begin
  create type assessment_status as enum (
    'in_progress',
    'summary_ready',
    'recommended',
    'completed',
    'expired'
  );
exception when duplicate_object then null; end $$;

create table if not exists public.ai_assessment_sessions (
  id                      uuid primary key default gen_random_uuid(),
  patient_id              uuid not null references public.profiles(id) on delete cascade,
  status                  assessment_status not null default 'in_progress',
  symptom_summary         jsonb not null default '{}'::jsonb,
  structured_answers      jsonb not null default '[]'::jsonb,
  is_emergency            boolean not null default false,
  emergency_reasons       jsonb not null default '[]'::jsonb,
  recommended_specialties jsonb not null default '[]'::jsonb,
  recent_turns            jsonb not null default '[]'::jsonb,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  expires_at              timestamptz not null default (now() + interval '24 hours')
);

create index if not exists ai_sessions_patient_idx
  on public.ai_assessment_sessions (patient_id, created_at desc);
create index if not exists ai_sessions_status_idx
  on public.ai_assessment_sessions (status);

drop trigger if exists trg_ai_sessions_updated_at on public.ai_assessment_sessions;
create trigger trg_ai_sessions_updated_at
  before update on public.ai_assessment_sessions
  for each row execute function public.set_updated_at();

-- دور المستخدم الحالي من ملفه الشخصي؛ SECURITY DEFINER يمنع تعارض RLS
-- عند قراءة profiles من داخل سياسة جدول الجلسات.
create or replace function public.current_role()
returns public.user_role
language sql stable security definer set search_path = public as $$
  select role
  from public.profiles
  where id = auth.uid()
  limit 1;
$$;

alter table public.ai_assessment_sessions enable row level security;

drop policy if exists ai_sessions_select_own_or_admin on public.ai_assessment_sessions;
create policy ai_sessions_select_own_or_admin
  on public.ai_assessment_sessions for select
  using (patient_id = auth.uid() or public.is_admin());

drop policy if exists ai_sessions_insert_own on public.ai_assessment_sessions;
create policy ai_sessions_insert_own
  on public.ai_assessment_sessions for insert
  with check (patient_id = auth.uid() and public.current_role() = 'USER');

drop policy if exists ai_sessions_update_own on public.ai_assessment_sessions;
create policy ai_sessions_update_own
  on public.ai_assessment_sessions for update
  using (patient_id = auth.uid())
  with check (patient_id = auth.uid());

drop policy if exists ai_sessions_delete_own on public.ai_assessment_sessions;
create policy ai_sessions_delete_own
  on public.ai_assessment_sessions for delete
  using (patient_id = auth.uid() or public.is_admin());

create or replace function public.count_recent_ai_sessions(
  p_patient_id uuid,
  p_since timestamptz
)
returns integer
language sql stable security definer set search_path = public as $$
  select count(*)::int
  from public.ai_assessment_sessions
  where patient_id = p_patient_id and created_at >= p_since;
$$;

create or replace function public.cleanup_expired_ai_sessions()
returns void
language sql security definer set search_path = public as $$
  update public.ai_assessment_sessions
  set status = 'expired', recent_turns = '[]'::jsonb
  where expires_at < now() and status <> 'expired';
$$;
