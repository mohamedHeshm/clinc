import { supabase } from "@/lib/supabase";
import type { Profile } from "@/types/models";

export async function fetchAdminUsers(search?: string): Promise<Profile[]> {
  let query = supabase.from("profiles").select("*").eq("role", "USER").order("created_at", { ascending: false });

  if (search?.trim()) {
    const term = search.trim();
    query = query.or(`full_name.ilike.%${term}%,phone.ilike.%${term}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Profile[];
}

export async function fetchUserById(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data as Profile;
}

export async function setUserAccountStatus(profileId: string, status: "active" | "suspended") {
  const { error } = await supabase.rpc("admin_set_account_status", {
    p_profile_id: profileId,
    p_status: status,
  });
  if (error) throw error;
}
