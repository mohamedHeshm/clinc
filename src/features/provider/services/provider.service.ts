import { supabase } from "@/lib/supabase";
import type { Doctor, Nurse } from "@/types/models";
import type { ProviderType } from "@/types/enums";

export interface MyProviderRecord {
  type: ProviderType;
  doctor: Doctor | null;
  nurse: Nurse | null;
  id: string; // doctors.id أو nurses.id حسب النوع
}

export async function fetchMyProviderRecord(
  profileId: string,
  role: "DOCTOR" | "NURSE"
): Promise<MyProviderRecord> {
  if (role === "DOCTOR") {
    const { data, error } = await supabase.from("doctors").select("*").eq("profile_id", profileId).single();
    if (error) throw error;
    return { type: "doctor", doctor: data as Doctor, nurse: null, id: data.id };
  }

  const { data, error } = await supabase.from("nurses").select("*").eq("profile_id", profileId).single();
  if (error) throw error;
  return { type: "nurse", doctor: null, nurse: data as Nurse, id: data.id };
}
