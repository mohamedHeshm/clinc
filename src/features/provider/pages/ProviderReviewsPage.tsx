import { Star, MessageSquareText } from "lucide-react";
import { useMyProvider } from "../hooks/useMyProvider";
import { useProviderReviews } from "@/features/reviews/hooks/useProviderReviews";
import { RatingStars } from "@/components/shared/RatingStars";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Spinner } from "@/components/feedback/Loading";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export function ProviderReviewsPage() {
  const { data: provider } = useMyProvider();
  const rating = provider?.doctor?.rating_avg ?? provider?.nurse?.rating_avg ?? 0;
  const ratingCount = provider?.doctor?.rating_count ?? provider?.nurse?.rating_count ?? 0;

  const { data: reviews, isLoading } = useProviderReviews(provider?.id, provider?.type ?? "doctor");

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold text-foreground">التقييمات</h1>

      <div className="mt-4 flex items-center gap-3 rounded-lg border border-border p-5">
        <Star className="h-8 w-8 fill-warning text-warning" />
        <div>
          <p className="text-2xl font-semibold text-foreground">{rating.toFixed(1)}</p>
          <p className="text-sm text-muted-foreground">{ratingCount} تقييم</p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        ) : !reviews || reviews.length === 0 ? (
          <EmptyState icon={MessageSquareText} title="لا توجد تقييمات بعد" />
        ) : (
          reviews.map((r) => (
            <div key={r.id} className="rounded-lg border border-border p-4">
              <div className="flex items-center justify-between">
                <RatingStars rating={r.rating} />
                <span className="text-xs text-muted-foreground">
                  {format(new Date(r.created_at), "d MMMM yyyy", { locale: ar })}
                </span>
              </div>
              {r.comment && <p className="mt-2 text-sm text-muted-foreground">{r.comment}</p>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
