import { Link } from "react-router-dom";
import { CalendarClock, Bell, Stethoscope, HeartPulse, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useMyBookings } from "@/features/bookings/hooks/useMyBookings";
import { useNotifications } from "@/features/notifications/hooks/useNotifications";
import { BOOKING_STATUS_LABELS, BOOKING_STATUS_VARIANT } from "@/constants/booking-status";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/shared/StatCard";
import { ROUTES } from "@/constants/routes";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export function DashboardOverviewPage() {
  const { profile } = useAuth();
  const { data: upcoming } = useMyBookings(["pending", "accepted", "confirmed", "in_progress"]);
  const { data: notifications } = useNotifications();

  const unreadCount = notifications?.filter((n) => !n.is_read).length ?? 0;
  const pendingCount = upcoming?.filter((b) => b.status === "pending").length ?? 0;
  const firstName = profile?.full_name?.split(" ")[0] ?? "";

  return (
    <div>
      <section className="overflow-hidden rounded-2xl bg-primary px-5 py-7 text-primary-foreground shadow-elevated sm:px-7 sm:py-8">
        <p className="text-sm text-primary-foreground/75">مرحبًا بعودتك</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">أهلًا، {firstName} 👋</h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-primary-foreground/75">كل تفاصيل رعايتك في مكان واحد، من الحجز حتى متابعة الموعد.</p>
      </section>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard icon={CalendarClock} label="حجوزات قادمة" value={upcoming?.length ?? 0} tone="primary" />
        <StatCard icon={Bell} label="إشعارات غير مقروءة" value={unreadCount} tone="accent" />
        <StatCard icon={CalendarClock} label="بانتظار الرد" value={pendingCount} tone="warning" />
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Button asChild className="h-auto min-h-16 justify-start px-5" size="lg">
          <Link to={ROUTES.doctors}>
            <Stethoscope className="h-4 w-4" />
            احجز مع طبيب
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-auto min-h-16 justify-start px-5" size="lg">
          <Link to={ROUTES.nurses}>
            <HeartPulse className="h-4 w-4" />
            اطلب تمريض منزلي
          </Link>
        </Button>
      </div>

      <section className="mt-9">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">حجوزاتك القادمة</h2>
          <Link
            to={ROUTES.dashboardBookings}
            className="flex items-center gap-1 text-sm text-primary transition-colors hover:text-primary-hover"
          >
            عرض الكل
            <ArrowLeft className="h-3.5 w-3.5" />
          </Link>
        </div>

        {upcoming && upcoming.length > 0 ? (
          <div className="mt-3 space-y-2">
            {upcoming.slice(0, 3).map((booking) => (
              <Link
                key={booking.id}
                to={ROUTES.dashboardBookingDetails(booking.id)}
                className="flex items-center justify-between rounded-xl border border-border bg-surface p-4 shadow-soft transition-all hover:border-primary/25 hover:shadow-elevated"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{booking.provider_name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {format(new Date(booking.booking_date), "d MMMM", { locale: ar })} —{" "}
                    {booking.start_time.slice(0, 5)}
                  </p>
                </div>
                <Badge variant={BOOKING_STATUS_VARIANT[booking.status]}>
                  {BOOKING_STATUS_LABELS[booking.status]}
                </Badge>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-3 rounded-lg border border-dashed border-border p-6 text-center">
            <p className="text-sm text-muted-foreground">لا توجد حجوزات قادمة حتى الآن.</p>
          </div>
        )}
      </section>
    </div>
  );
}
