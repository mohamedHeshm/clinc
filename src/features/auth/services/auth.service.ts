import { supabase } from "@/lib/supabase";
import type { Gender } from "@/types/enums";

/**
 * قرار معماري: التسجيل يعتمد على البريد الإلكتروني ككلمة مرور + هوية أساسية
 * (Supabase Auth email/password) لأنه الأبسط والأكثر موثوقية للـ MVP.
 * رقم الهاتف يُخزَّن كبيانات ملف شخصي (profiles.phone) وليس كهوية دخول،
 * ويمكن التوسّع لاحقًا بإضافة Phone OTP كخيار دخول إضافي دون تعديل هذا الملف
 * من الخارج — فقط إضافة دوال جديدة هنا.
 */

export interface SignUpInput {
  fullName: string;
  phone: string;
  email: string;
  password: string;
  gender?: Gender;
  address?: string;
}

export async function signUp({ fullName, phone, email, password, gender, address }: SignUpInput) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/login?confirmed=1`,
      data: {
        full_name: fullName,
        phone,
        gender: gender ?? "",
        address: address ?? "",
      },
    },
  });

  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function requestPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) throw error;
}

export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}
