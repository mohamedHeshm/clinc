import { supabase } from "@/lib/supabase";
import type { Service } from "@/types/models";

export async function fetchAdminServices(): Promise<Service[]> {
  const { data, error } = await supabase.from("services").select("*").order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Service[];
}

export interface ServiceInput {
  name: string;
  description?: string | null;
  applies_to: ("doctor" | "nurse")[];
  default_price?: number | null;
  is_active?: boolean;
}

export async function createService(input: ServiceInput) {
  const { error } = await supabase.from("services").insert(input);
  if (error) throw error;
}

export async function updateService(serviceId: string, updates: Partial<ServiceInput>) {
  const { error } = await supabase.from("services").update(updates).eq("id", serviceId);
  if (error) throw error;
}

export async function toggleServiceActive(serviceId: string, isActive: boolean) {
  const { error } = await supabase.from("services").update({ is_active: isActive }).eq("id", serviceId);
  if (error) throw error;
}
