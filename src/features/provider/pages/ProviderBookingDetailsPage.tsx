import { useState } from "react";
import { useParams } from "react-router-dom";
import { Phone, MapPin, Calendar as CalendarIcon, Clock, FileText } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useProviderBooking, useUpdateBookingStatus } from "../hooks/useProviderBookings";
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
import { BookingTimeline } from "@/components/shared/BookingTimeline";
import { Spinner } from "@/components/feedback/Loading";
import { ErrorState } from "@/components/feedback/ErrorState";
import { EmptyState } from "@/components/feedback/EmptyState";
import {
  BOOKING_STATUS_LABELS,
  BOOKING_STATUS_VARIANT,
  BOOKING_STATUS_DESCRIPTIONS,
  CANCELLABLE_BOOKING_STATUSES,
} from "@/constants/booking-status";
import type { BookingStatus } from "@/types/enums";

const NEXT_ACTIONS: Partial<Record<BookingStatus, { label: string; next: BookingStatus }[]>> = {
  pending: [
    { label: "قبول", next: "accepted" },
    { label: "رفض", next: "rejected" },
  ],
  accepted: [{ label: "تأكيد الحجز", next: "confirmed" }],
  confirmed: [{ label: "بدء الخدمة", next: "in_progress" }],
  in_progress: [{ label: "إنهاء الخدمة", next: "completed" }],
};

export function ProviderBookingDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { data: booking, isLoading, isError, refetch } = useProviderBooking(id);
  const updateStatus = useUpdateBookingStatus();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }
  if (isError) return <ErrorState onRetry={() => refetch()} />;
  if (!booking) return <EmptyState title="لم يتم العثور على هذا الحجز" />;

  const actions = NEXT_ACTIONS[booking.status] ?? [];
  const canCancel = CANCELLABLE_BOOKING_STATUSES.includes(booking.status);
  const isPending = booking.status === "pending";

  return (
    <div className="max-w-xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">تفاصيل الحجز</h1>
        <Badge variant={BOOKING_STATUS_VARIANT[booking.status]}>
          {BOOKING_STATUS_LABELS[booking.status]}
        </Badge>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{BOOKING_STATUS_DESCRIPTIONS[booking.status]}</p>

      <div className="mt-5 space-y-3 rounded-lg border border-border p-5 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">المريض</span>
          <span className="text-foreground">{booking.patient_name}</span>
        </div>
        {booking.patient_phone && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">الهاتف</span>
            <a href={`tel:${booking.patient_phone}`} className="flex items-center gap-1.5 text-primary">
              <Phone className="h-3.5 w-3.5" />
              {booking.patient_phone}
            </a>
          </div>
        )}
        <div className="flex items-center gap-2 border-t border-border pt-3 text-foreground">
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
        <div className="border-t border-border pt-3 font-medium text-foreground">{booking.price} جنيه</div>
      </div>

      <div className="mt-4 rounded-lg border border-border p-5">
        <p className="mb-4 text-sm font-semibold text-foreground">مراحل الحجز</p>
        <BookingTimeline status={booking.status} />
      </div>

      {isPending && (
        <p className="mt-4 text-xs text-muted-foreground">لا يمكن إلغاء الطلب قبل الرد عليه.</p>
      )}

      {(actions.length > 0 || canCancel) && (
        <div className="mt-4 flex flex-wrap gap-3">
          {actions.map((action) => (
            <Button
              key={action.next}
              variant={action.next === "rejected" ? "outline" : "default"}
              disabled={updateStatus.isPending}
              onClick={() => updateStatus.mutate({ bookingId: booking.id, status: action.next })}
            >
              {action.label}
            </Button>
          ))}
          {canCancel && (
            <Button variant="outline" disabled={updateStatus.isPending} onClick={() => setIsConfirmOpen(true)}>
              إلغاء
            </Button>
          )}
        </div>
      )}

      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إلغاء الحجز؟</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من رغبتك في إلغاء هذا الموعد مع {booking.patient_name}؟
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">رجوع</Button>
            </DialogClose>
            <Button
              variant="destructive"
              disabled={updateStatus.isPending}
              onClick={() =>
                updateStatus.mutate(
                  { bookingId: booking.id, status: "cancelled" },
                  { onSuccess: () => setIsConfirmOpen(false) }
                )
              }
            >
              {updateStatus.isPending ? "جارٍ الإلغاء..." : "تأكيد الإلغاء"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
