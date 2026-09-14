import { supabase } from "@/lib/supabase";
import type { ProviderType } from "@/types/enums";

export interface TimeSlot {
  slot_start: string;
  slot_end: string;
  is_available: boolean;
}

export async function fetchAvailableSlots(
  providerId: string,
  providerType: ProviderType,
  date: string,
  slotMinutes = 60
): Promise<TimeSlot[]> {
  const { data, error } = await supabase.rpc("get_available_slots", {
    p_provider_id: providerId,
    p_provider_type: providerType,
    p_date: date,
    p_slot_minutes: slotMinutes,
  });

  if (error) throw error;
  return (data ?? []) as TimeSlot[];
}
