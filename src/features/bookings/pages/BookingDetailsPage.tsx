import { useState } from "react";
import { useParams } from "react-router-dom";
import { MapPin, Calendar as CalendarIcon, Clock, FileText, Navigation } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useBooking, useCancelBooking } from "../hooks/useMyBookings";
import { useBookingReview } from "@/features/reviews/hooks/useCreateReview";
import { ReviewForm } from "@/features/reviews/components/ReviewForm";
import { RatingStars } from "@/components/shared/RatingStars";
import { BookingTimeline } from "@/components/shared/BookingTimeline";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/feedback/Loading";
import { ErrorState } from "@/components/feedback/ErrorState";
import { EmptyState } from "@/components/feedback/EmptyState";
import {
  BOOKING_STATUS_LABELS,
  BOOKING_STATUS_VARIANT,
  BOOKING_STATUS_DESCRIPTIONS,
  CANCELLABLE_BOOKING_STATUSES,
} from "@/constants/booking-status";
import { useAuth } from "@/contexts/AuthContext";
import { MedicalMap, type MapPoint } from "@/features/maps/components/MedicalMap";
import { distanceInKm, formatDistance } from "@/utils/distance";

export function BookingDetailsPage() {
  const { profile } = useAuth();
  const { id } = useParams<{ id: string }>();
  const { data: booking, isLoading, isError, refetch } = useBooking(id);
  const { data: existingReview } = useBookingReview(booking?.status === "completed" ? id : undefined);
  const cancelMutation = useCancelBooking();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (isError) return <ErrorState onRetry={() => refetch()} />;

  if (!booking) {
    return <EmptyState title="لم يتم العثور على هذا الحجز" />;
  }

  const canCancel = CANCELLABLE_BOOKING_STATUSES.includes(booking.status);
  const isPending = booking.status === "pending";
  const canShareLocation = booking.status === "confirmed" || booking.status === "in_progress" || booking.status === "completed";
  const patientLocation = profile?.latitude != null && profile.longitude != null
    ? { latitude: profile.latitude, longitude: profile.longitude }
    : booking.location;
  const mapPoints: MapPoint[] = [
    ...(patientLocation ? [{ ...patientLocation, label: "موقعك", tone: "patient" as const }] : []),
    ...(booking.provider_location ? [{ ...booking.provider_location, label: booking.provider_name, description: booking.provider_type === "doctor" ? "موقع العيادة" : "موقع الممرض/ة", tone: booking.provider_type === "doctor" ? "doctor" as const : "nurse" as const }] : []),
  ];
  const distance = patientLocation && booking.provider_location ? formatDistance(distanceInKm(patientLocation, booking.provider_location)) : null;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">تفاصيل الحجز</h1>
        <Badge variant={BOOKING_STATUS_VARIANT[booking.status]}>
          {BOOKING_STATUS_LABELS[booking.status]}
        </Badge>
      </div>

      {canShareLocation && mapPoints.length > 0 && (
        <section className="mt-4 rounded-xl border border-border bg-surface p-4 shadow-soft">
          <div className="mb-3 flex items-center justify-between gap-3"><div><h2 className="font-semibold text-foreground">خريطة الموعد</h2><p className="text-xs text-muted-foreground">{distance ? `المسافة التقريبية: ${distance}` : "حدد موقعك من الملف الشخصي لعرض المسافة."}</p></div></div>
          <MedicalMap points={mapPoints} readonly height="15rem" />
          {patientLocation && booking.provider_location && <Button className="mt-3 w-full" variant="outline" asChild><a href={`https://www.google.com/maps/dir/?api=1&origin=${patientLocation.latitude},${patientLocation.longitude}&destination=${booking.provider_location.latitude},${booking.provider_location.longitude}`} target="_blank" rel="noreferrer"><Navigation className="h-4 w-4" />فتح الطريق</a></Button>}
        </section>
      )}
      <p className="mt-1 text-sm text-muted-foreground">{BOOKING_STATUS_DESCRIPTIONS[booking.status]}</p>

      {isPending && (
        <div className="mt-4 rounded-lg border border-warning/30 bg-warning/5 p-4 text-sm text-foreground">
          <p className="font-medium">طلب الحجز قيد المراجعة</p>
          <p className="mt-1 text-muted-foreground">
            سيظهر الموعد كمؤكد بعد موافقة الطبيب أو الممرض.
          </p>
        </div>
      )}

      <div className="mt-5 flex items-center gap-3 rounded-lg border border-border p-5">
        <Avatar className="h-14 w-14">
          <AvatarImage src={booking.provider_avatar_url ?? undefined} alt={booking.provider_name} />
          <AvatarFallback>{booking.provider_name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium text-foreground">{booking.provider_name}</p>
          <p className="text-sm text-muted-foreground">{booking.provider_subtitle}</p>
        </div>
      </div>

      <div className="mt-4 space-y-3 rounded-lg border border-border p-5 text-sm">
        <div className="flex items-center gap-2 text-foreground">
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          {format(new Date(booking.booking_date), "EEEE d MMMM yyyy", { locale: ar })}
        </div>
        <div className="flex items-center gap-2 text-foreground">
          <Clock className="h-4 w-4 text-muted-foreground" />
          {booking.start_time.slice(0, 5)} — {booking.end_time.slice(0, 5)}
        </div>
        {booking.service_name && (
          <div className="flex items-center gap-2 text-foreground">
            <FileText className="h-4 w-4 text-muted-foreground" />
            {booking.service_name}
          </div>
        )}
        {booking.location && (
          <div className="flex items-center gap-2 text-foreground">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            {booking.location.address}
          </div>
        )}
        {booking.notes && (
          <p className="rounded bg-surface-muted p-3 text-muted-foreground">{booking.notes}</p>
        )}
        <div className="border-t border-border pt-3 font-medium text-foreground">
          {booking.price} جنيه
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-border p-5">
        <p className="mb-4 text-sm font-semibold text-foreground">مراحل الحجز</p>
        <BookingTimeline status={booking.status} />
      </div>

      {canCancel && (
        <Button variant="outline" className="mt-4" onClick={() => setIsConfirmOpen(true)}>
          إلغاء الموعد
        </Button>
      )}
      {isPending && (
        <p className="mt-4 text-xs text-muted-foreground">يمكن إلغاء الموعد بعد تأكيده.</p>
      )}

      {booking.status === "completed" && (
        <div className="mt-4">
          {existingReview ? (
            <div className="rounded-lg border border-border p-5">
              <p className="text-sm font-semibold text-foreground">تقييمك</p>
              <RatingStars rating={existingReview.rating} className="mt-2" />
              {existingReview.comment && (
                <p className="mt-2 text-sm text-muted-foreground">{existingReview.comment}</p>
              )}
            </div>
          ) : (
            <ReviewForm booking={booking} />
          )}
        </div>
      )}

      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إلغاء الحجز؟</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من رغبتك في إلغاء هذا الموعد مع {booking.provider_name}؟
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">رجوع</Button>
            </DialogClose>
            <Button
              variant="destructive"
              disabled={cancelMutation.isPending}
              onClick={() =>
                cancelMutation.mutate(booking.id, { onSuccess: () => setIsConfirmOpen(false) })
              }
            >
              {cancelMutation.isPending ? "جارٍ الإلغاء..." : "تأكيد الإلغاء"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
