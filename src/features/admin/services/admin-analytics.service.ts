import { supabase } from "@/lib/supabase";

export interface AnalyticsData {
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  popularSpecializations: { specialization: string; count: number }[];
  topDoctors: { name: string; rating: number; reviewCount: number }[];
  topNurses: { name: string; rating: number; reviewCount: number }[];
}

export async function fetchAnalytics(): Promise<AnalyticsData> {
  const [bookingsRes, doctorsRes, nursesRes] = await Promise.all([
    supabase.from("bookings").select("status, provider_type, provider_id"),
    supabase
      .from("doctors")
      .select("specialization, rating_avg, rating_count, profiles!doctors_profile_id_fkey(full_name)")
      .order("rating_avg", { ascending: false })
      .limit(5),
    supabase
      .from("nurses")
      .select("rating_avg, rating_count, profiles!nurses_profile_id_fkey(full_name)")
      .order("rating_avg", { ascending: false })
      .limit(5),
  ]);

  const bookings = bookingsRes.data ?? [];
  const specializationCounts = new Map<string, number>();

  // نحتاج تخصص كل حجز — بما إن الحجز نفسه مايحملش التخصص، نجمّعها من جدول doctors
  const doctorIds = [...new Set(bookings.filter((b) => b.provider_type === "doctor").map((b) => b.provider_id))];
  const { data: doctorSpecs } = doctorIds.length
    ? await supabase.from("doctors").select("id, specialization").in("id", doctorIds)
    : { data: [] as { id: string; specialization: string }[] };

  const specByDoctorId = new Map((doctorSpecs ?? []).map((d) => [d.id, d.specialization]));
  for (const b of bookings) {
    if (b.provider_type !== "doctor") continue;
    const spec = specByDoctorId.get(b.provider_id);
    if (!spec) continue;
    specializationCounts.set(spec, (specializationCounts.get(spec) ?? 0) + 1);
  }

  const popularSpecializations = Array.from(specializationCounts.entries())
    .map(([specialization, count]) => ({ specialization, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    totalBookings: bookings.length,
    completedBookings: bookings.filter((b) => b.status === "completed").length,
    cancelledBookings: bookings.filter((b) => b.status === "cancelled").length,
    popularSpecializations,
    topDoctors: (doctorsRes.data ?? []).map((d) => ({
      name: (d.profiles as unknown as { full_name: string })?.full_name ?? "",
      rating: d.rating_avg,
      reviewCount: d.rating_count,
    })),
    topNurses: (nursesRes.data ?? []).map((n) => ({
      name: (n.profiles as unknown as { full_name: string })?.full_name ?? "",
      rating: n.rating_avg,
      reviewCount: n.rating_count,
    })),
  };
}
