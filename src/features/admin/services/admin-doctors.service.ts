import { supabase } from "@/lib/supabase";
import type { Doctor } from "@/types/models";

export interface AdminDoctorRow extends Doctor {
  full_name: string;
  account_status: "active" | "suspended";
  email?: string;
}

export async function fetchAdminDoctors(search?: string): Promise<AdminDoctorRow[]> {
  let query = supabase
    .from("doctors")
    .select("*, profiles!doctors_profile_id_fkey(full_name, status)")
    .order("created_at", { ascending: false });

  const { data, error } = await query;
  if (error) throw error;

  let rows = (data ?? []).map((row) => {
    const profile = row.profiles as unknown as { full_name: string; status: "active" | "suspended" };
    return {
      ...(row as unknown as Doctor),
      full_name: profile?.full_name ?? "",
      account_status: profile?.status ?? "active",
    } as AdminDoctorRow;
  });

  if (search?.trim()) {
    const term = search.trim().toLowerCase();
    rows = rows.filter(
      (r) => r.full_name.toLowerCase().includes(term) || r.specialization.toLowerCase().includes(term)
    );
  }

  return rows;
}

export async function fetchAdminDoctorById(doctorId: string): Promise<AdminDoctorRow | null> {
  const { data, error } = await supabase
    .from("doctors")
    .select("*, profiles!doctors_profile_id_fkey(full_name, status)")
    .eq("id", doctorId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }

  const profile = data.profiles as unknown as { full_name: string; status: "active" | "suspended" };
  return {
    ...(data as unknown as Doctor),
    full_name: profile?.full_name ?? "",
    account_status: profile?.status ?? "active",
  } as AdminDoctorRow;
}

export interface CreateDoctorAccountInput {
  fullName: string;
  phone: string;
  email: string;
  temporaryPassword: string;
  specialization: string;
  bio?: string;
  experienceYears: number;
  clinicAddress: string;
  clinicLatitude?: number;
  clinicLongitude?: number;
  consultationPrice: number;
}

/**
 * ينادي Edge Function admin-create-provider-account (المرحلة 4) — الطريقة
 * الآمنة الوحيدة لإنشاء حساب طبيب جديد، لأنها الوحيدة المصرَّح لها باستخدام
 * service_role. راجع تعليمات نشر الدالة في README قبل استخدام هذا الفورم.
 */
export async function createDoctorAccount(input: CreateDoctorAccountInput) {
  const { data, error } = await supabase.functions.invoke("admin-create-provider-account", {
    body: {
      fullName: input.fullName,
      phone: input.phone,
      email: input.email,
      temporaryPassword: input.temporaryPassword,
      providerType: "doctor",
      doctor: {
        specialization: input.specialization,
        bio: input.bio,
        experienceYears: input.experienceYears,
        clinicAddress: input.clinicAddress,
        clinicLatitude: input.clinicLatitude,
        clinicLongitude: input.clinicLongitude,
        consultationPrice: input.consultationPrice,
      },
    },
  });

if (error) {
  console.error("❌ Edge Function Error:", error);
  console.error("❌ Error context:", error.context);

  try {
    const response = error.context as Response;

    if (response) {
      const responseText = await response.text();
      console.error("❌ Server response:", responseText);
    }
  } catch (e) {
    console.error("❌ Could not read server response:", e);
  }

  throw error;
}

console.log("✅ Provider created:", data);
return data;

export interface UpdateDoctorInput {
  specialization?: string;
  bio?: string | null;
  experience_years?: number;
  clinic_address?: string;
  consultation_price?: number;
  is_active?: boolean;
}

export async function updateDoctorAsAdmin(doctorId: string, updates: UpdateDoctorInput, description: string) {
  const { error } = await supabase.from("doctors").update(updates).eq("id", doctorId);
  if (error) throw error;

  await supabase.rpc("admin_log_action", {
    p_action_type: "update_doctor",
    p_target_table: "doctors",
    p_target_id: doctorId,
    p_description: description,
  });
}

export async function setDoctorAccountStatus(
  profileId: string,
  status: "active" | "suspended"
) {
  const { error } = await supabase.rpc("admin_set_account_status", {
    p_profile_id: profileId,
    p_status: status,
  });
  if (error) throw error;
}
