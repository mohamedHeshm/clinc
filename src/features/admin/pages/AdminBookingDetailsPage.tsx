import { useParams } from "react-router-dom";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useAdminBookingDetails } from "../hooks/useAdminData";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/feedback/Loading";
import { EmptyState } from "@/components/feedback/EmptyState";
import { BOOKING_STATUS_LABELS, BOOKING_STATUS_VARIANT } from "@/constants/booking-status";

export function AdminBookingDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { data: booking, isLoading } = useAdminBookingDetails(id);

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!booking) return <EmptyState title="لم يتم العثور على هذا الحجز" />;

  return (
    <div className="max-w-xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">تفاصيل الحجز</h1>
        <Badge variant={BOOKING_STATUS_VARIANT[booking.status]}>
          {BOOKING_STATUS_LABELS[booking.status]}
        </Badge>
      </div>

      <div className="mt-6 space-y-2 rounded-lg border border-border p-5 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">المستخدم</span>
          <span className="text-foreground">{booking.patient_name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">مقدّم الخدمة</span>
          <span className="text-foreground">{booking.provider_name}</span>
        </div>
        <div className="flex justify-between border-t border-border pt-2">
          <span className="text-muted-foreground">التاريخ</span>
          <span className="text-foreground">
            {format(new Date(booking.booking_date), "EEEE d MMMM yyyy", { locale: ar })}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">الوقت</span>
          <span className="text-foreground">
            {booking.start_time.slice(0, 5)} — {booking.end_time.slice(0, 5)}
          </span>
        </div>
        {booking.notes && (
          <p className="rounded bg-surface-muted p-3 text-muted-foreground">{booking.notes}</p>
        )}
        <div className="flex justify-between border-t border-border pt-2 font-medium">
          <span className="text-muted-foreground">السعر</span>
          <span className="text-foreground">{booking.price} جنيه</span>
        </div>
      </div>
    </div>
  );
}
