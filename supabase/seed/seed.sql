-- ─────────────────────────────────────────────────────────────
-- هذا الملف Seed Data للتطوير المحلي فقط (npm run supabase:seed أو
-- supabase db reset). لا يحتوي على أطباء/ممرضين وهميين — فقط كتالوج
-- الخدمات الأساسي المذكور في قسم 13 من المواصفة، وهو بيانات حقيقية
-- (Reference Data) وليست بيانات تجريبية مزيّفة، لذلك من المقبول
-- تشغيله حتى في أول إعداد لقاعدة بيانات production جديدة.
-- ─────────────────────────────────────────────────────────────

insert into public.services (name, description, applies_to, default_price) values
  ('كشف عام', 'كشف طبي عام في العيادة', array['doctor']::public.provider_kind[], null),
  ('استشارة متابعة', 'زيارة متابعة لحالة سابقة', array['doctor']::public.provider_kind[], null),
  ('غيار جروح', 'تنظيف وتغيير ضمادات الجروح', array['nurse']::public.provider_kind[], 150),
  ('حقن', 'إعطاء حقن طبية حسب الروشتة', array['nurse']::public.provider_kind[], 100),
  ('قياس ضغط وسكر', 'قياس ضغط الدم ونسبة السكر بالدم', array['nurse']::public.provider_kind[], 80),
  ('تركيب كانيولا', 'تركيب كانيولا وريدية', array['nurse']::public.provider_kind[], 150),
  ('رعاية منزلية', 'رعاية تمريضية شاملة بالمنزل', array['nurse']::public.provider_kind[], 300),
  ('متابعة مريض', 'متابعة دورية لحالة مريض بالمنزل', array['nurse']::public.provider_kind[], 200),
  ('تغيير الضمادات', 'تغيير ضمادات ما بعد العمليات', array['nurse']::public.provider_kind[], 120)
on conflict (lower(name)) do nothing;
