import { supabase } from "@/lib/supabase";
import { withTimeout } from "@/lib/async";
import type { PickedLocation } from "@/features/maps/components/LocationPicker";

export interface CreateNurseBookingInput {
  nurseId: string;
  serviceId: string | null;
  date: string;
  startTime: string;
  endTime: string;
  price: number;
  location: PickedLocation;
  notes?: string;
}

export async function createNurseBooking(input: CreateNurseBookingInput) {
  const { data: booking, error: bookingError } = await withTimeout(
    supabase.rpc("create_booking", {
      p_provider_id: input.nurseId,
      p_provider_type: "nurse",
      p_service_id: input.serviceId,
      p_date: input.date,
      p_start: input.startTime,
      p_end: input.endTime,
      p_price: input.price,
      ...(input.notes ? { p_notes: input.notes } : {}),
    })
  );

  if (bookingError) {
    const isSlotConflict =
      bookingError.code === "23P01" ||
      bookingError.message.includes("لم يعد متاحًا");

    throw Object.assign(new Error(bookingError.message), {
      isSlotConflict,
    });
  }

  const bookingId = (booking as { id: string }).id;

  const { error: locationError } = await withTimeout(
    supabase.from("locations").insert({
      booking_id: bookingId,
      latitude: input.location.latitude,
      longitude: input.location.longitude,
      address: input.location.address,
      ...(input.notes ? { notes: input.notes } : {}),
    })
  );

  if (locationError) {
    // فشل حفظ الموقع بعد نجاح إنشاء الحجز.
    // نُلغي الحجز تلقائيًا حتى لا يبقى حجز زيارة منزلية بدون عنوان.
    await supabase
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", bookingId);

    throw new Error(
      "تعذّر حفظ موقع الزيارة. تم إلغاء الحجز — برجاء المحاولة مرة أخرى."
    );
  }

  return booking;
}
