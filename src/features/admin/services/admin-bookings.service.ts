import { supabase } from "@/lib/supabase";
import type { Booking } from "@/types/models";
import type { BookingStatus, ProviderType } from "@/types/enums";

export interface AdminBookingRow extends Booking {
  patient_name: string;
  provider_name: string;
}

export interface AdminBookingFilters {
  status?: BookingStatus;
  providerType?: ProviderType;
  dateFrom?: string;
  dateTo?: string;
}

export async function fetchAdminBookings(filters: AdminBookingFilters): Promise<AdminBookingRow[]> {
  let query = supabase.from("bookings").select("*").order("booking_date", { ascending: false });

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.providerType) query = query.eq("provider_type", filters.providerType);
  if (filters.dateFrom) query = query.gte("booking_date", filters.dateFrom);
  if (filters.dateTo) query = query.lte("booking_date", filters.dateTo);

  const { data, error } = await query.limit(200);
  if (error) throw error;

  return enrichAdminBookings((data ?? []) as Booking[]);
}

export async function fetchAdminBookingById(id: string): Promise<AdminBookingRow | null> {
  const { data, error } = await supabase.from("bookings").select("*").eq("id", id).single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  const [enriched] = await enrichAdminBookings([data as Booking]);
  return enriched ?? null;
}

async function enrichAdminBookings(bookings: Booking[]): Promise<AdminBookingRow[]> {
  if (bookings.length === 0) return [];

  const patientIds = [...new Set(bookings.map((b) => b.patient_id))];
  const doctorIds = [...new Set(bookings.filter((b) => b.provider_type === "doctor").map((b) => b.provider_id))];
  const nurseIds = [...new Set(bookings.filter((b) => b.provider_type === "nurse").map((b) => b.provider_id))];

  const [patientsRes, doctorsRes, nursesRes] = await Promise.all([
    supabase.from("profiles").select("id, full_name").in("id", patientIds),
    doctorIds.length
      ? supabase.from("doctors").select("id, profile_id, profiles!doctors_profile_id_fkey(full_name)").in("id", doctorIds)
      : Promise.resolve({ data: [], error: null }),
    nurseIds.length
      ? supabase.from("nurses").select("id, profile_id, profiles!nurses_profile_id_fkey(full_name)").in("id", nurseIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const patientsMap = new Map((patientsRes.data ?? []).map((p) => [p.id, p.full_name]));
  const doctorsMap = new Map(
    (doctorsRes.data ?? []).map((d) => [
      d.id,
      (d.profiles as unknown as { full_name: string })?.full_name ?? "",
    ])
  );
  const nursesMap = new Map(
    (nursesRes.data ?? []).map((n) => [
      n.id,
      (n.profiles as unknown as { full_name: string })?.full_name ?? "",
    ])
  );

  return bookings.map((b) => ({
    ...b,
    patient_name: patientsMap.get(b.patient_id) ?? "مستخدم",
    provider_name:
      b.provider_type === "doctor"
        ? `د. ${doctorsMap.get(b.provider_id) ?? ""}`
        : nursesMap.get(b.provider_id) ?? "",
  }));
}
