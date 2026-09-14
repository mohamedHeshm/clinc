-- ─────────────────────────────────────────────────────────────
-- تفعيل Supabase Realtime — بدون هذا، اشتراكات postgres_changes
-- في الواجهة (src/features/notifications) مش هتستقبل أي تحديثات.
-- notifications: لإشعارات فورية (Notification Bell).
-- bookings: لتحديث حالة الحجوزات/الطلبات/الـ Calendar لحظيًا عند
-- الأطباء/الممرضين والمستخدمين بدون إعادة تحميل الصفحة.
-- ─────────────────────────────────────────────────────────────

alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.bookings;
