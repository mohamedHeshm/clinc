import { useParams, Link } from "react-router-dom";
import { MapPin, MessageSquareText } from "lucide-react";
import { useDoctor, useDoctorServices } from "../hooks/useDoctors";
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

export function DoctorProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { data: doctor, isLoading, isError, refetch } = useDoctor(id);
  const { data: services } = useDoctorServices(id);
  const { data: availability } = useProviderAvailability(id, "doctor");
  const { data: reviews } = useProviderReviews(id, "doctor");

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

  if (!doctor) {
    return (
      <EmptyState
        title="لم يتم العثور على هذا الطبيب"
        description="ربما تم إيقاف هذا الحساب أو الرابط غير صحيح"
      />
    );
  }

  return (
    <div className="container max-w-3xl py-10">
      <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-right">
        <Avatar className="h-24 w-24">
          <AvatarImage src={doctor.avatar_url ?? undefined} alt={doctor.full_name} />
          <AvatarFallback className="text-2xl">{doctor.full_name.charAt(0)}</AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <h1 className="text-xl font-semibold text-foreground">د. {doctor.full_name}</h1>
          <p className="text-muted-foreground">{doctor.specialization}</p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
            <RatingStars rating={doctor.rating_avg} reviewCount={doctor.rating_count} size="md" />
            {doctor.available_today && <Badge variant="success">متاح اليوم</Badge>}
          </div>
        </div>

        <div className="w-full sm:w-auto">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link to={ROUTES.bookDoctor(doctor.id)}>حجز موعد</Link>
          </Button>
          <p className="mt-2 text-sm text-muted-foreground">{doctor.consultation_price} جنيه</p>
        </div>
      </div>

      {doctor.bio && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold text-foreground">نبذة</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{doctor.bio}</p>
        </section>
      )}

      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        <div>
          <h2 className="text-sm font-semibold text-foreground">سنوات الخبرة</h2>
          <p className="mt-1 text-sm text-muted-foreground">{doctor.experience_years} سنة</p>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground">العنوان</h2>
          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            {doctor.clinic_address}
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
                <span className="text-muted-foreground">
                  {s.price ?? doctor.consultation_price} جنيه
                </span>
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
            description="كن أول من يقيّم هذا الطبيب بعد إتمام الحجز"
            className="py-8"
          />
        )}
      </section>
    </div>
  );
}
