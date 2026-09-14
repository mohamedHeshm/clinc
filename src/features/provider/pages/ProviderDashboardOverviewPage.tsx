import { Link } from "react-router-dom";
import { isToday } from "date-fns";
import { Inbox, CalendarClock, Star, Wallet, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useMyProvider } from "../hooks/useMyProvider";
import { useProviderBookings } from "../hooks/useProviderBookings";
import { ProviderBookingCard } from "../components/ProviderBookingCard";
import { StatCard } from "@/components/shared/StatCard";
import { Spinner } from "@/components/feedback/Loading";
import { ROUTES } from "@/constants/routes";

export function ProviderDashboardOverviewPage() {
  const { profile } = useAuth();
  const { data: provider } = useMyProvider();
  const { data: allBookings, isLoading } = useProviderBookings();

  const rating = provider?.doctor?.rating_avg ?? provider?.nurse?.rating_avg ?? 0;

  const todayBookings = (allBookings ?? []).filter((b) => isToday(new Date(b.booking_date)));
  const pendingRequests = (allBookings ?? []).filter((b) => b.status === "pending");
  const completedCount = (allBookings ?? []).filter((b) => b.status === "completed").length;
  const revenue = (allBookings ?? [])
    .filter((b) => b.status === "completed")
    .reduce((sum, b) => sum + b.price, 0);

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        أهلًا، {profile?.full_name?.split(" ")[0]} 👋
      </h1>
      <p className="mt-1.5 text-sm text-muted-foreground">إليك ملخّص نشاطك اليوم</p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={CalendarClock} label="حجوزات اليوم" value={todayBookings.length} tone="primary" />
        <StatCard icon={Inbox} label="طلبات جديدة" value={pendingRequests.length} tone="warning" />
        <StatCard icon={Star} label="التقييم" value={rating.toFixed(1)} tone="warning" />
        <StatCard icon={Wallet} label="إجمالي الإيرادات" value={revenue} tone="accent" />
      </div>

      <p className="mt-4 text-sm text-muted-foreground">{completedCount} خدمة مكتملة إجمالًا</p>

      <section className="mt-9">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">طلبات بانتظار ردك</h2>
          <Link
            to={ROUTES.providerRequests}
            className="flex items-center gap-1 text-sm text-primary transition-colors hover:text-primary-hover"
          >
            عرض الكل
            <ArrowLeft className="h-3.5 w-3.5" />
          </Link>
        </div>

        {pendingRequests.length > 0 ? (
          <div className="mt-3 space-y-4">
            {pendingRequests.slice(0, 3).map((booking) => (
              <ProviderBookingCard key={booking.id} booking={booking} />
            ))}
          </div>
        ) : (
          <div className="mt-3 rounded-lg border border-dashed border-border p-6 text-center">
            <p className="text-sm text-muted-foreground">لا توجد طلبات جديدة حاليًا.</p>
          </div>
        )}
      </section>
    </div>
  );
}
