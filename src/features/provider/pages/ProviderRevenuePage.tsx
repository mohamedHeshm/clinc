import { useMemo } from "react";
import { Wallet } from "lucide-react";
import { format, isSameMonth } from "date-fns";
import { ar } from "date-fns/locale";
import { useProviderBookings } from "../hooks/useProviderBookings";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Spinner } from "@/components/feedback/Loading";

export function ProviderRevenuePage() {
  const { data: completed, isLoading } = useProviderBookings(["completed"]);

  const stats = useMemo(() => {
    const bookings = completed ?? [];
    const total = bookings.reduce((sum, b) => sum + b.price, 0);
    const thisMonth = bookings
      .filter((b) => isSameMonth(new Date(b.booking_date), new Date()))
      .reduce((sum, b) => sum + b.price, 0);
    return { total, thisMonth, count: bookings.length };
  }, [completed]);

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold text-foreground">الإيرادات</h1>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border p-4">
          <Wallet className="h-5 w-5 text-primary" />
          <p className="mt-2 text-xl font-semibold text-foreground">{stats.total} جنيه</p>
          <p className="text-sm text-muted-foreground">إجمالي الإيرادات</p>
        </div>
        <div className="rounded-lg border border-border p-4">
          <Wallet className="h-5 w-5 text-accent" />
          <p className="mt-2 text-xl font-semibold text-foreground">{stats.thisMonth} جنيه</p>
          <p className="text-sm text-muted-foreground">هذا الشهر</p>
        </div>
        <div className="rounded-lg border border-border p-4">
          <p className="mt-2 text-xl font-semibold text-foreground">{stats.count}</p>
          <p className="text-sm text-muted-foreground">خدمة مكتملة</p>
        </div>
      </div>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-foreground">آخر الخدمات المكتملة</h2>
        <div className="mt-3 space-y-2">
          {isLoading ? (
            <div className="flex justify-center py-6">
              <Spinner />
            </div>
          ) : !completed || completed.length === 0 ? (
            <EmptyState title="لا توجد خدمات مكتملة بعد" className="py-8" />
          ) : (
            completed.slice(0, 10).map((b) => (
              <div key={b.id} className="flex items-center justify-between rounded-lg border border-border px-4 py-3 text-sm">
                <div>
                  <p className="text-foreground">{b.patient_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(b.booking_date), "d MMMM yyyy", { locale: ar })}
                  </p>
                </div>
                <p className="font-medium text-foreground">{b.price} جنيه</p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
