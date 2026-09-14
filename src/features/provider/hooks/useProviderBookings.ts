import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  fetchProviderBookings,
  fetchProviderBookingById,
  updateBookingStatus,
} from "../services/provider-bookings.service";
import type { BookingStatus, ProviderType } from "@/types/enums";
import { useMyProvider } from "./useMyProvider";

export function useProviderBooking(bookingId: string | undefined) {
  return useQuery({
    queryKey: ["provider-booking", bookingId],
    queryFn: () => fetchProviderBookingById(bookingId as string),
    enabled: Boolean(bookingId),
  });
}

export function useProviderBookings(statusFilter?: readonly BookingStatus[]) {
  const { data: provider } = useMyProvider();
  const providerId = provider?.id;
  const providerType: ProviderType | undefined = provider?.type;

  return useQuery({
    queryKey: ["provider-bookings", providerId, providerType, statusFilter],
    queryFn: () => fetchProviderBookings(providerId as string, providerType as ProviderType, statusFilter),
    enabled: Boolean(providerId && providerType),
  });
}

const SUCCESS_MESSAGES: Partial<Record<BookingStatus, string>> = {
  accepted: "تم تأكيد الحجز بنجاح",
  rejected: "تم رفض طلب الحجز",
  confirmed: "تم تأكيد الحجز بنجاح",
  in_progress: "بدأت الخدمة",
  completed: "تم إنهاء الخدمة",
  cancelled: "تم إلغاء الموعد",
};

export function useUpdateBookingStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bookingId, status }: { bookingId: string; status: BookingStatus }) =>
      updateBookingStatus(bookingId, status),
    onSuccess: (_data, variables) => {
      toast.success(SUCCESS_MESSAGES[variables.status] ?? "تم تحديث الحجز");
      queryClient.invalidateQueries({ queryKey: ["provider-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["provider-booking", variables.bookingId] });
    },
    onError: () => {
      toast.error("تعذّر تنفيذ الإجراء. برجاء المحاولة مرة أخرى.");
    },
  });
}
