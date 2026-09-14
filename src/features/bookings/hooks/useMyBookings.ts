import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { fetchMyBookings, fetchBookingById, cancelBooking } from "../services/bookings.service";
import type { BookingStatus } from "@/types/enums";

export function useMyBookings(statusFilter?: readonly BookingStatus[]) {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ["my-bookings", profile?.id, statusFilter],
    queryFn: () => fetchMyBookings(profile!.id, statusFilter),
    enabled: Boolean(profile?.id),
  });
}

export function useBooking(bookingId: string | undefined) {
  return useQuery({
    queryKey: ["booking", bookingId],
    queryFn: () => fetchBookingById(bookingId as string),
    enabled: Boolean(bookingId),
  });
}

export function useCancelBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bookingId: string) => cancelBooking(bookingId),
    onSuccess: () => {
      toast.success("تم إلغاء الموعد");
      queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["booking"] });
    },
    onError: () => {
      toast.error("تعذّر إلغاء الحجز. برجاء المحاولة مرة أخرى.");
    },
  });
}
