import { CheckCircle2, XCircle, BarChart3, Star } from "lucide-react";
import { useAnalytics } from "../hooks/useAdminData";
import { Spinner } from "@/components/feedback/Loading";
import { EmptyState } from "@/components/feedback/EmptyState";

export function AdminAnalyticsPage() {
  const { data, isLoading } = useAnalytics();

  if (isLoading || !data) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-foreground">الإحصائيات</h1>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-border p-4">
          <BarChart3 className="h-5 w-5 text-primary" />
          <p className="mt-2 text-xl font-semibold text-foreground">{data.totalBookings}</p>
          <p className="text-sm text-muted-foreground">إجمالي الحجوزات</p>
        </div>
        <div className="rounded-lg border border-border p-4">
          <CheckCircle2 className="h-5 w-5 text-accent" />
          <p className="mt-2 text-xl font-semibold text-foreground">{data.completedBookings}</p>
          <p className="text-sm text-muted-foreground">مكتملة</p>
        </div>
        <div className="rounded-lg border border-border p-4">
          <XCircle className="h-5 w-5 text-destructive" />
          <p className="mt-2 text-xl font-semibold text-foreground">{data.cancelledBookings}</p>
          <p className="text-sm text-muted-foreground">ملغاة</p>
        </div>
      </div>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-foreground">أكثر التخصصات طلبًا</h2>
        {data.popularSpecializations.length === 0 ? (
          <EmptyState title="لا توجد بيانات كافية بعد" className="py-8" />
        ) : (
          <div className="mt-3 space-y-2">
            {data.popularSpecializations.map((s) => (
              <div key={s.specialization} className="flex items-center justify-between rounded-lg border border-border px-4 py-3 text-sm">
                <span className="text-foreground">{s.specialization}</span>
                <span className="text-muted-foreground">{s.count} حجز</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-foreground">أفضل الأطباء تقييمًا</h2>
        <div className="mt-3 space-y-2">
          {data.topDoctors.map((d) => (
            <div key={d.name} className="flex items-center justify-between rounded-lg border border-border px-4 py-3 text-sm">
              <span className="text-foreground">د. {d.name}</span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                {d.rating.toFixed(1)} ({d.reviewCount})
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-foreground">أفضل الممرضين تقييمًا</h2>
        <div className="mt-3 space-y-2">
          {data.topNurses.map((n) => (
            <div key={n.name} className="flex items-center justify-between rounded-lg border border-border px-4 py-3 text-sm">
              <span className="text-foreground">{n.name}</span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                {n.rating.toFixed(1)} ({n.reviewCount})
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
