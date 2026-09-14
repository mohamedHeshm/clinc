import { supabase } from "@/lib/supabase";
import type { Gender } from "@/types/enums";

export interface UpdateProfileInput {
  full_name?: string;
  phone?: string;
  gender?: Gender;
  address?: string | null;
  avatar_url?: string | null;
}

export async function updateProfile(userId: string, updates: UpdateProfileInput) {
  const { error } = await supabase.from("profiles").update(updates).eq("id", userId);
  if (error) throw error;
}

const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2MB — يطابق حد الـ bucket
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("صيغة الصورة غير مدعومة. استخدم JPG أو PNG أو WEBP.");
  }
  if (file.size > MAX_AVATAR_SIZE) {
    throw new Error("حجم الصورة كبير جدًا — الحد الأقصى 2 ميجابايت.");
  }

  const extension = file.name.split(".").pop();
  const path = `${userId}/avatar-${Date.now()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, cacheControl: "3600" });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  return data.publicUrl;
}
