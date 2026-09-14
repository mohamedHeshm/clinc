import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCreateReview } from "../hooks/useCreateReview";
import { useAuth } from "@/contexts/AuthContext";
import type { EnrichedBooking } from "@/features/bookings/services/bookings.service";

export function ReviewForm({ booking }: { booking: EnrichedBooking }) {
  const { profile } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const createReview = useCreateReview();

  if (!profile) return null;

  const handleSubmit = () => {
    if (rating === 0) return;
    createReview.mutate({
      bookingId: booking.id,
      userId: profile.id,
      providerId: booking.provider_id,
      providerType: booking.provider_type,
      rating,
      comment: comment.trim() || undefined,
    });
  };

  return (
    <div className="rounded-lg border border-border p-5">
      <p className="text-sm font-semibold text-foreground">قيّم تجربتك مع {booking.provider_name}</p>

      <div className="mt-3 flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            aria-label={`${star} نجوم`}
            className="p-0.5"
          >
            <Star
              className={cn(
                "h-7 w-7 transition-colors",
                (hoverRating || rating) >= star ? "fill-warning text-warning" : "text-border"
              )}
            />
          </button>
        ))}
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="أضف تعليقًا (اختياري)"
        rows={3}
        className="mt-4 w-full resize-none rounded border border-border bg-surface px-3.5 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />

      <Button
        className="mt-4"
        disabled={rating === 0 || createReview.isPending}
        onClick={handleSubmit}
      >
        {createReview.isPending ? "جارٍ الإرسال..." : "إرسال التقييم"}
      </Button>
    </div>
  );
}
