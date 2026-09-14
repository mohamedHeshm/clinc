import { supabase } from "@/lib/supabase";
import type { Booking, BookingLocation } from "@/types/models";
import type { BookingStatus, ProviderType } from "@/types/enums";

export interface ProviderBooking extends Booking {
  patient_name: string;
  patient_phone: string;
  service_name: string | null;
  location: BookingLocation | null;
}

export async function fetchProviderBookings(
  providerId: string,
  providerType: ProviderType,
  statusFilter?: readonly BookingStatus[]
): Promise<ProviderBooking[]> {
  let query = supabase
    .from("bookings")
    .select("*")
    .eq("provider_id", providerId)
    .eq("provider_type", providerType)
    .order("booking_date", { ascending: true })
    .order("start_time", { ascending: true });

  if (statusFilter && statusFilter.length > 0) {
    query = query.in("status", statusFilter as BookingStatus[]);
  }

  const { data, error } = await query;
  if (error) throw error;

  return enrichProviderBookings((data ?? []) as Booking[]);
}

async function enrichProviderBookings(bookings: Booking[]): Promise<ProviderBooking[]> {
  if (bookings.length === 0) return [];

  const patientIds = [...new Set(bookings.map((b) => b.patient_id))];
  const serviceIds = [...new Set(bookings.map((b) => b.service_id).filter((id): id is string => Boolean(id)))];
  const bookingIds = bookings.map((b) => b.id);

  const [patientsRes, servicesRes, locationsRes] = await Promise.all([
    supabase.from("profiles").select("id, full_name, phone").in("id", patientIds),
    serviceIds.length
      ? supabase.from("services").select("id, name").in("id", serviceIds)
      : Promise.resolve({ data: [], error: null }),
    supabase.from("locations").select("*").in("booking_id", bookingIds),
  ]);

  const patientsMap = new Map((patientsRes.data ?? []).map((p) => [p.id, p]));
  const servicesMap = new Map((servicesRes.data ?? []).map((s) => [s.id, s.name]));
  const locationsMap = new Map((locationsRes.data ?? []).map((l) => [l.booking_id, l as BookingLocation]));

  return bookings.map((booking) => {
    const patient = patientsMap.get(booking.patient_id);
    return {
      ...booking,
      patient_name: patient?.full_name ?? "مستخدم",
      patient_phone: patient?.phone ?? "",
      service_name: booking.service_id ? servicesMap.get(booking.service_id) ?? null : null,
      location: locationsMap.get(booking.id) ?? null,
    };
  });
}

export async function updateBookingStatus(bookingId: string, status: BookingStatus) {
  const { error } = await supabase.from("bookings").update({ status }).eq("id", bookingId);
  if (error) throw error;
}

export async function fetchProviderBookingById(bookingId: string): Promise<ProviderBooking | null> {
  const { data, error } = await supabase.from("bookings").select("*").eq("id", bookingId).single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  const [enriched] = await enrichProviderBookings([data as Booking]);
  return enriched ?? null;
}
