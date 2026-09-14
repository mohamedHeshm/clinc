import { supabase } from "@/lib/supabase";
import type { Availability } from "@/types/models";

const DAY_LABELS = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

export function dayOfWeekLabel(day: number): string {
  return DAY_LABELS[day] ?? "";
}

export async function fetchProviderAvailability(
  providerId: string,
  providerType: "doctor" | "nurse"
): Promise<Availability[]> {
  const { data, error } = await supabase
    .from("availability")
    .select("*")
    .eq("provider_id", providerId)
    .eq("provider_type", providerType)
    .eq("is_available", true)
    .order("day_of_week", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) throw error;
  return (data ?? []) as Availability[];
}

/** كل صفوف Availability بما فيها المعطّلة — تُستخدم في لوحة إدارة مقدّم الخدمة نفسه */
export async function fetchAllProviderAvailability(
  providerId: string,
  providerType: "doctor" | "nurse"
): Promise<Availability[]> {
  const { data, error } = await supabase
    .from("availability")
    .select("*")
    .eq("provider_id", providerId)
    .eq("provider_type", providerType)
    .order("day_of_week", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) throw error;
  return (data ?? []) as Availability[];
}

export interface AvailabilityInput {
  provider_id: string;
  provider_type: "doctor" | "nurse";
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

export async function addAvailabilitySlot(input: AvailabilityInput) {
  const { error } = await supabase.from("availability").insert(input);
  if (error) throw error;
}

export async function toggleAvailabilitySlot(id: string, isAvailable: boolean) {
  const { error } = await supabase.from("availability").update({ is_available: isAvailable }).eq("id", id);
  if (error) throw error;
}

export async function deleteAvailabilitySlot(id: string) {
  const { error } = await supabase.from("availability").delete().eq("id", id);
  if (error) throw error;
}
