import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createReview, fetchReviewByBookingId, type CreateReviewInput } from "../services/reviews.service";

export function useBookingReview(bookingId: string | undefined) {
  return useQuery({
    queryKey: ["booking-review", bookingId],
    queryFn: () => fetchReviewByBookingId(bookingId as string),
    enabled: Boolean(bookingId),
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateReviewInput) => createReview(input),
    onSuccess: (_data, variables) => {
      toast.success("شكرًا لتقييمك");
      queryClient.invalidateQueries({ queryKey: ["booking-review", variables.bookingId] });
      queryClient.invalidateQueries({ queryKey: ["provider-reviews"] });
    },
    onError: () => {
      toast.error("تعذّر إرسال التقييم. برجاء المحاولة مرة أخرى.");
    },
  });
}
