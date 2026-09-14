import { useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Calendar as CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
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
import {
  BOOKING_STATUS_LABELS,
  BOOKING_STATUS_VARIANT,
  CANCELLABLE_BOOKING_STATUSES,
} from "@/constants/booking-status";
import { useCancelBooking } from "../hooks/useMyBookings";
import type { EnrichedBooking } from "../services/bookings.service";
import { ROUTES } from "@/constants/routes";

export function BookingCard({ booking }: { booking: EnrichedBooking }) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const cancelMutation = useCancelBooking();

  const canCancel = CANCELLABLE_BOOKING_STATUSES.includes(booking.status);
  const canReview = booking.status === "completed";
  const isPending = booking.status === "pending";

  return (
    <div className="rounded-lg border border-border bg-surface p-5 transition-shadow hover:shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={booking.provider_avatar_url ?? undefined} alt={booking.provider_name} />
            <AvatarFallback>{booking.provider_name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-foreground">{booking.provider_name}</p>
            <p className="text-sm text-muted-foreground">{booking.provider_subtitle}</p>
          </div>
        </div>
        <Badge variant={BOOKING_STATUS_VARIANT[booking.status]}>
          {BOOKING_STATUS_LABELS[booking.status]}
        </Badge>
      </div>

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
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

      {isPending && (
        <p className="mt-3 text-xs text-muted-foreground">يمكن إلغاء الموعد بعد تأكيده.</p>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
        <p className="text-sm font-medium text-foreground">{booking.price} جنيه</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to={ROUTES.dashboardBookingDetails(booking.id)}>التفاصيل</Link>
          </Button>
          {canCancel && (
            <Button variant="ghost" size="sm" onClick={() => setIsConfirmOpen(true)}>
              إلغاء الموعد
            </Button>
          )}
          {canReview && (
            <Button size="sm" asChild>
              <Link to={ROUTES.dashboardBookingDetails(booking.id)}>قيّم التجربة</Link>
            </Button>
          )}
        </div>
      </div>

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
