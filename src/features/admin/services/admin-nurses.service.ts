import { supabase } from "@/lib/supabase";
import type { Nurse } from "@/types/models";

export interface AdminNurseRow extends Nurse {
  full_name: string;
  account_status: "active" | "suspended";
}

export async function fetchAdminNurses(search?: string): Promise<AdminNurseRow[]> {
  const { data, error } = await supabase
    .from("nurses")
    .select("*, profiles!nurses_profile_id_fkey(full_name, status)")
    .order("created_at", { ascending: false });

  if (error) throw error;

  let rows = (data ?? []).map((row) => {
    const profile = row.profiles as unknown as { full_name: string; status: "active" | "suspended" };
    return {
      ...(row as unknown as Nurse),
      full_name: profile?.full_name ?? "",
      account_status: profile?.status ?? "active",
    } as AdminNurseRow;
  });

  if (search?.trim()) {
    const term = search.trim().toLowerCase();
    rows = rows.filter((r) => r.full_name.toLowerCase().includes(term));
  }

  return rows;
}

export async function fetchAdminNurseById(nurseId: string): Promise<AdminNurseRow | null> {
  const { data, error } = await supabase
    .from("nurses")
    .select("*, profiles!nurses_profile_id_fkey(full_name, status)")
    .eq("id", nurseId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }

  const profile = data.profiles as unknown as { full_name: string; status: "active" | "suspended" };
  return {
    ...(data as unknown as Nurse),
    full_name: profile?.full_name ?? "",
    account_status: profile?.status ?? "active",
  } as AdminNurseRow;
}

export interface CreateNurseAccountInput {
  fullName: string;
  phone: string;
  email: string;
  temporaryPassword: string;
  bio?: string;
  experienceYears: number;
  serviceArea: string[];
  visitPrice: number;
  baseLatitude?: number;
  baseLongitude?: number;
}

export async function createNurseAccount(input: CreateNurseAccountInput) {
  const session = (await supabase.auth.getSession()).data.session;

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-create-provider-account`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token ?? ""}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        fullName: input.fullName,
        phone: input.phone,
        email: input.email,
        temporaryPassword: input.temporaryPassword,
        providerType: "nurse",
        nurse: {
          bio: input.bio,
          experienceYears: input.experienceYears,
          serviceArea: input.serviceArea,
          visitPrice: input.visitPrice,
          baseLatitude: input.baseLatitude,
          baseLongitude: input.baseLongitude,
        },
      }),
    },
  );

  const responseText = await response.text();

  console.log("🔴 Status:", response.status);
  console.log("🔴 Server response:", responseText);

  if (!response.ok) {
    throw new Error(responseText || `HTTP ${response.status}`);
  }

  try {
    const result = JSON.parse(responseText);
    console.log("✅ Nurse account created:", result);
    return result;
  } catch {
    console.log("✅ Nurse account created:", responseText);
    return responseText;
  }
}
export interface UpdateNurseInput {
  bio?: string | null;
  experience_years?: number;
  service_area?: string[];
  visit_price?: number;
  is_active?: boolean;
  base_latitude?: number | null;
  base_longitude?: number | null;
}

export async function updateNurseAsAdmin(nurseId: string, updates: UpdateNurseInput, description: string) {
  const { error } = await supabase.from("nurses").update(updates).eq("id", nurseId);
  if (error) throw error;

  await supabase.rpc("admin_log_action", {
    p_action_type: "update_nurse",
    p_target_table: "nurses",
    p_target_id: nurseId,
    p_description: description,
  });
}

export async function setNurseAccountStatus(profileId: string, status: "active" | "suspended") {
  const { error } = await supabase.rpc("admin_set_account_status", {
    p_profile_id: profileId,
    p_status: status,
  });
  if (error) throw error;
}
