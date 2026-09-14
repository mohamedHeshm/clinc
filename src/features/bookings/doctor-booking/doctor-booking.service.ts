import { supabase } from "@/lib/supabase";
import { withTimeout } from "@/lib/async";

export interface CreateDoctorBookingInput {
  doctorId: string;
  serviceId: string | null;
  date: string;
  startTime: string;
  endTime: string;
  price: number;
  notes?: string;
}

/**
 * الحماية الحقيقية ضد Double Booking موجودة في قاعدة البيانات
 * (exclusion constraint).
 *
 * هذه الدالة تلتقط رسالة التعارض وتحوّلها لعلم مميّز
 * (isSlotConflict) حتى تتمكن الواجهة من عرض رسالة مناسبة
 * واقتراح إعادة اختيار الوقت.
 */
export async function createDoctorBooking(
  input: CreateDoctorBookingInput
) {
  const { data, error } = await withTimeout(
    supabase.rpc("create_booking", {
      p_provider_id: input.doctorId,
      p_provider_type: "doctor",
      p_service_id: input.serviceId,
      p_date: input.date,
      p_start: input.startTime,
      p_end: input.endTime,
      p_price: input.price,
      ...(input.notes ? { p_notes: input.notes } : {}),
    })
  );

  if (error) {
    const isSlotConflict =
      error.code === "23P01" ||
      error.message.includes("لم يعد متاحًا");

    throw Object.assign(new Error(error.message), {
      isSlotConflict,
    });
  }

  return data;
}
