import { supabase } from "@/lib/supabase";
import type { Booking, BookingLocation } from "@/types/models";
import type { BookingStatus } from "@/types/enums";

export interface EnrichedBooking extends Booking {
  provider_name: string;
  provider_avatar_url: string | null;
  provider_subtitle: string; // تخصص الطبيب أو "ممرض/ة"
  service_name: string | null;
  location: BookingLocation | null;
  provider_location: { latitude: number; longitude: number } | null;
}

export async function fetchMyBookings(patientId: string, statusFilter?: readonly BookingStatus[]) {
  let query = supabase
    .from("bookings")
    .select("*")
    .eq("patient_id", patientId)
    .order("booking_date", { ascending: false })
    .order("start_time", { ascending: false });

  if (statusFilter && statusFilter.length > 0) {
    query = query.in("status", statusFilter as BookingStatus[]);
  }

  const { data, error } = await query;
  if (error) throw error;

  return enrichBookings((data ?? []) as Booking[]);
}

export async function fetchBookingById(bookingId: string): Promise<EnrichedBooking | null> {
  const { data, error } = await supabase.from("bookings").select("*").eq("id", bookingId).single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  const [enriched] = await enrichBookings([data as Booking]);
  return enriched ?? null;
}

/** يجمع أسماء مقدّمي الخدمة (polymorphic doctor/nurse) وأسماء الخدمات والموقع دفعة واحدة */
async function enrichBookings(bookings: Booking[]): Promise<EnrichedBooking[]> {
  if (bookings.length === 0) return [];

  const doctorIds = [...new Set(bookings.filter((b) => b.provider_type === "doctor").map((b) => b.provider_id))];
  const nurseIds = [...new Set(bookings.filter((b) => b.provider_type === "nurse").map((b) => b.provider_id))];
  const serviceIds = [...new Set(bookings.map((b) => b.service_id).filter((id): id is string => Boolean(id)))];
  const bookingIds = bookings.map((b) => b.id);

  const [doctorsRes, nursesRes, servicesRes, locationsRes] = await Promise.all([
    doctorIds.length
      ? supabase.from("doctors_public").select("id, full_name, avatar_url, specialization, clinic_latitude, clinic_longitude").in("id", doctorIds)
      : Promise.resolve({ data: [], error: null }),
    nurseIds.length
      ? supabase.from("nurses_public").select("id, full_name, avatar_url, base_latitude, base_longitude").in("id", nurseIds)
      : Promise.resolve({ data: [], error: null }),
    serviceIds.length
      ? supabase.from("services").select("id, name").in("id", serviceIds)
      : Promise.resolve({ data: [], error: null }),
    supabase.from("locations").select("*").in("booking_id", bookingIds),
  ]);

  const doctorsMap = new Map((doctorsRes.data ?? []).map((d) => [d.id, d]));
  const nursesMap = new Map((nursesRes.data ?? []).map((n) => [n.id, n]));
  const servicesMap = new Map((servicesRes.data ?? []).map((s) => [s.id, s.name]));
  const locationsMap = new Map((locationsRes.data ?? []).map((l) => [l.booking_id, l as BookingLocation]));

  return bookings.map((booking) => {
    if (booking.provider_type === "doctor") {
      const doctor = doctorsMap.get(booking.provider_id);
      return {
        ...booking,
        provider_name: doctor ? `د. ${doctor.full_name}` : "طبيب",
        provider_avatar_url: doctor?.avatar_url ?? null,
        provider_subtitle: doctor?.specialization ?? "",
        service_name: booking.service_id ? servicesMap.get(booking.service_id) ?? null : null,
        location: locationsMap.get(booking.id) ?? null,
        provider_location: doctor?.clinic_latitude != null && doctor.clinic_longitude != null
          ? { latitude: doctor.clinic_latitude, longitude: doctor.clinic_longitude }
          : null,
      };
    }
    const nurse = nursesMap.get(booking.provider_id);
    return {
      ...booking,
      provider_name: nurse?.full_name ?? "ممرض/ة",
      provider_avatar_url: nurse?.avatar_url ?? null,
      provider_subtitle: "زيارة منزلية",
      service_name: booking.service_id ? servicesMap.get(booking.service_id) ?? null : null,
      location: locationsMap.get(booking.id) ?? null,
      provider_location: nurse?.base_latitude != null && nurse.base_longitude != null
        ? { latitude: nurse.base_latitude, longitude: nurse.base_longitude }
        : null,
    };
  });
}

export async function cancelBooking(bookingId: string) {
  const { error } = await supabase.from("bookings").update({ status: "cancelled" }).eq("id", bookingId);
  if (error) throw error;
}
