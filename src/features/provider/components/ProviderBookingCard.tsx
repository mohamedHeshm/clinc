import { useState } from "react";
import { Link } from "react-router-dom";
import { Phone, MapPin, Calendar as CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
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
import {
  BOOKING_STATUS_LABELS,
  BOOKING_STATUS_VARIANT,
  CANCELLABLE_BOOKING_STATUSES,
} from "@/constants/booking-status";
import { useUpdateBookingStatus } from "../hooks/useProviderBookings";
import type { ProviderBooking } from "../services/provider-bookings.service";
import { ROUTES } from "@/constants/routes";

const NEXT_ACTIONS: Partial<
  Record<ProviderBooking["status"], { label: string; next: ProviderBooking["status"]; variant?: "default" | "outline" }[]>
> = {
  pending: [
    { label: "قبول", next: "accepted" },
    { label: "رفض", next: "rejected", variant: "outline" },
  ],
  accepted: [{ label: "تأكيد الحجز", next: "confirmed" }],
  confirmed: [{ label: "بدء الخدمة", next: "in_progress" }],
  in_progress: [{ label: "إنهاء الخدمة", next: "completed" }],
};

export function ProviderBookingCard({ booking }: { booking: ProviderBooking }) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const updateStatus = useUpdateBookingStatus();
  const actions = NEXT_ACTIONS[booking.status] ?? [];
  const canCancel = CANCELLABLE_BOOKING_STATUSES.includes(booking.status);
  const isPending = booking.status === "pending";

  return (
    <div className="rounded-lg border border-border bg-surface p-5 transition-shadow hover:shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-foreground">{booking.patient_name}</p>
          {booking.patient_phone && (
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Phone className="h-3.5 w-3.5" />
              <a href={`tel:${booking.patient_phone}`} className="hover:text-primary">
                {booking.patient_phone}
              </a>
            </p>
          )}
        </div>
        <Badge variant={BOOKING_STATUS_VARIANT[booking.status]}>
          {BOOKING_STATUS_LABELS[booking.status]}
        </Badge>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <CalendarIcon className="h-4 w-4" />
          {format(new Date(booking.booking_date), "d MMMM yyyy", { locale: ar })}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="h-4 w-4" />
          {booking.start_time.slice(0, 5)}
        </span>
        {booking.location && (
          <span className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4" />
            {booking.location.address}
          </span>
        )}
      </div>

      {booking.service_name && (
        <p className="mt-2 text-sm text-foreground">{booking.service_name}</p>
      )}
      {booking.notes && <p className="mt-1 text-sm text-muted-foreground">{booking.notes}</p>}

      {isPending && (
        <p className="mt-3 text-xs text-muted-foreground">
          لا يمكن إلغاء الطلب قبل الرد عليه — اقبل أو ارفض أولًا.
        </p>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
        <p className="text-sm font-medium text-foreground">{booking.price} جنيه</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to={ROUTES.providerBookingDetails(booking.id)}>التفاصيل</Link>
          </Button>
          {canCancel && (
            <Button variant="ghost" size="sm" onClick={() => setIsConfirmOpen(true)}>
              إلغاء
            </Button>
          )}
          {actions.map((action) => (
            <Button
              key={action.next}
              size="sm"
              variant={action.variant ?? "default"}
              disabled={updateStatus.isPending}
              onClick={() => updateStatus.mutate({ bookingId: booking.id, status: action.next })}
            >
              {action.label}
            </Button>
          ))}
        </div>
      </div>

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
