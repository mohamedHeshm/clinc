-- ─────────────────────────────────────────────────────────────
-- Storage — قسم 53 بالمواصفة: صور المستخدمين/الأطباء/الممرضين
-- تُخزَّن كلها في bucket واحد public اسمه avatars، بمسار:
--   avatars/{auth.uid()}/{filename}
-- كل مستخدم (USER/DOCTOR/NURSE/ADMIN) يرفع صورته في مجلده الخاص فقط —
-- هذا يغطي "users/doctors/nurses" كمجلدات فرعية تلقائيًا حسب من رفع الصورة.
-- ─────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2 * 1024 * 1024, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- القراءة عامة (الصور تظهر في صفحات التصفح العامة لكل الزوّار)
create policy avatars_public_read
  on storage.objects for select
  using (bucket_id = 'avatars');

-- الرفع/التعديل/الحذف مقصور على مجلد المستخدم نفسه فقط:
-- المسار المتوقع avatars/<user_id>/<filename> → أول جزء من المسار لازم يطابق auth.uid()
create policy avatars_insert_own_folder
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy avatars_update_own_folder
  on storage.objects for update
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy avatars_delete_own_folder
  on storage.objects for delete
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
