import { useParams, Link } from "react-router-dom";
import { MapPin, MessageSquareText } from "lucide-react";
import { useNurse, useNurseServices } from "../hooks/useNurses";
import { useProviderAvailability } from "@/features/availability/hooks/useProviderAvailability";
import { dayOfWeekLabel } from "@/features/availability/services/availability.service";
import { useProviderReviews } from "@/features/reviews/hooks/useProviderReviews";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RatingStars } from "@/components/shared/RatingStars";
import { Spinner } from "@/components/feedback/Loading";
import { ErrorState } from "@/components/feedback/ErrorState";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ROUTES } from "@/constants/routes";

export function NurseProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { data: nurse, isLoading, isError, refetch } = useNurse(id);
  const { data: services } = useNurseServices(id);
  const { data: availability } = useProviderAvailability(id, "nurse");
  const { data: reviews } = useProviderReviews(id, "nurse");

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (isError) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  if (!nurse) {
    return (
      <EmptyState
        title="لم يتم العثور على هذا الممرض"
        description="ربما تم إيقاف هذا الحساب أو الرابط غير صحيح"
      />
    );
  }

  return (
    <div className="container max-w-3xl py-10">
      <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-right">
        <Avatar className="h-24 w-24">
          <AvatarImage src={nurse.avatar_url ?? undefined} alt={nurse.full_name} />
          <AvatarFallback className="text-2xl">{nurse.full_name.charAt(0)}</AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <h1 className="text-xl font-semibold text-foreground">{nurse.full_name}</h1>
          <p className="text-muted-foreground">{nurse.experience_years} سنوات خبرة</p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
            <RatingStars rating={nurse.rating_avg} reviewCount={nurse.rating_count} size="md" />
            {nurse.available_today && <Badge variant="success">متاحة اليوم</Badge>}
          </div>
        </div>

        <div className="w-full sm:w-auto">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link to={ROUTES.bookNurse(nurse.id)}>طلب زيارة منزلية</Link>
          </Button>
          <p className="mt-2 text-sm text-muted-foreground">{nurse.visit_price} جنيه</p>
        </div>
      </div>

      {nurse.bio && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold text-foreground">نبذة</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{nurse.bio}</p>
        </section>
      )}

      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        <div>
          <h2 className="text-sm font-semibold text-foreground">سنوات الخبرة</h2>
          <p className="mt-1 text-sm text-muted-foreground">{nurse.experience_years} سنة</p>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground">المناطق التي يخدم بها</h2>
          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            {nurse.service_area.join("، ") || "غير محدد"}
          </p>
        </div>
      </section>

      {services && services.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold text-foreground">الخدمات</h2>
          <div className="mt-3 divide-y divide-border rounded-lg border border-border">
            {services.map((s) => (
              <div key={s.service_id} className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="text-foreground">{s.name}</span>
                <span className="text-muted-foreground">{s.price ?? nurse.visit_price} جنيه</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {availability && availability.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold text-foreground">مواعيد العمل</h2>
          <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
            {availability.map((a) => (
              <div key={a.id} className="flex justify-between">
                <span>{dayOfWeekLabel(a.day_of_week)}</span>
                <span>
                  {a.start_time.slice(0, 5)} — {a.end_time.slice(0, 5)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-foreground">التقييمات</h2>
        {reviews && reviews.length > 0 ? (
          <div className="mt-3 space-y-4">
            {reviews.map((r) => (
              <div key={r.id} className="rounded-lg border border-border p-4">
                <RatingStars rating={r.rating} size="sm" />
                {r.comment && <p className="mt-2 text-sm text-muted-foreground">{r.comment}</p>}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={MessageSquareText}
            title="لا توجد تقييمات بعد"
            description="كن أول من يقيّم هذا الممرض بعد إتمام الزيارة"
            className="py-8"
          />
        )}
      </section>
    </div>
  );
}
