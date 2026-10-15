
import { Link } from "react-router-dom";
import { MapPin, BriefcaseMedical, Star } from "lucide-react";
import type { DoctorRecommendation } from "@/services/aiAssistant.service";
import { Button } from "@/components/ui/button";

const CONFIDENCE_LABEL = {
  high: "صلة قوية",
  medium: "صلة متوسطة",
  low: "صلة محتملة",
} as const;

function formatTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ar-EG", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function Rating({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-1" aria-label={`التقييم ${rating} من 5`}>
      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
      {rating.toFixed(1)}
    </span>
  );
}

/** كل البيانات هنا من قاعدة البيانات الفعلية. الحجز الفعلي يتم في صفحة الطبيب بنفس مسار الحجز الحالي. */
export function DoctorRecommendationCard({
  rec,
}: {
  rec: DoctorRecommendation;
}) {
  const d = rec.doctor;

  return (
    <article className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 sm:p-5">
      <div className="flex items-start gap-3.5">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)]">
          {d.avatar_url ? (
            <img
              src={d.avatar_url}
              alt={d.full_name}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-lg font-medium">
              {d.full_name.trim().charAt(0)}
            </span>
          )}
        </span>

        <div className="min-w-0 flex-1">
          <h3 className="truncate font-medium text-[var(--color-ink)]">
            {d.full_name}
          </h3>

          <p className="text-sm text-[var(--color-ink-muted)]">
            {d.specialization_name ?? rec.specialtyName}
          </p>

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--color-ink-muted)]">
            <span className="flex items-center gap-1">
              <BriefcaseMedical className="h-3.5 w-3.5" />
              {d.experience_years} سنوات خبرة
            </span>

            {d.reviews_count > 0 ? (
              <span className="flex items-center gap-1">
                <Rating rating={d.average_rating} />
                ({d.reviews_count})
              </span>
            ) : (
              <span>لا توجد تقييمات بعد</span>
            )}
          </div>
        </div>

        <span className="shrink-0 text-sm font-semibold text-[var(--color-ink)]">
          {d.consultation_price} جنيه
        </span>
      </div>

      {d.clinic_address && (
        <p className="mt-2 flex items-start gap-1.5 text-sm text-[var(--color-ink-muted)]">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {d.clinic_address}
        </p>
      )}

      <p className="mt-3 rounded-[var(--radius-sm)] bg-[var(--color-surface-muted)] px-3 py-2 text-xs leading-6 text-[var(--color-ink-muted)]">
        <span className="font-medium text-[var(--color-ink)]">
          {CONFIDENCE_LABEL[rec.confidence]} — {rec.specialtyName}:
        </span>{" "}
        {rec.reason}
      </p>

      <div className="mt-3">
        {rec.nextSlots ? (
          <>
            <p className="mb-1.5 text-xs text-[var(--color-ink-muted)]">
              أقرب مواعيد متاحة ({rec.nextSlots.date})
            </p>

            <div className="flex flex-wrap gap-1.5" dir="ltr">
              {rec.nextSlots.slots.map((slot) => (
                <Link
                  key={slot.slot_start}
                  to={`/doctors/${d.doctor_id}`}
                  className="rounded-[var(--radius-sm)] border border-[var(--color-border)] px-2.5 py-1.5 text-xs hover:border-[var(--color-primary)]"
                >
                  {formatTime(slot.slot_start)}
                </Link>
              ))}
            </div>
          </>
        ) : (
          <p className="text-xs text-[var(--color-ink-faint)]">
            لا توجد مواعيد متاحة خلال الأيام السبعة القادمة.
          </p>
        )}
      </div>

      <div className="mt-4 flex gap-2">
        <Link to={`/doctors/${d.doctor_id}`} className="flex-1">
          <Button size="sm" className="w-full">
            حجز موعد
          </Button>
        </Link>

        <Link to={`/doctors/${d.doctor_id}`} className="flex-1">
          <Button size="sm" variant="outline" className="w-full">
            عرض الملف
          </Button>
        </Link>
      </div>
    </article>
  );
}
