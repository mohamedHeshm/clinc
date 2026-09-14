import { Users, Stethoscope, HeartPulse, CalendarClock, Inbox, CheckCircle2 } from "lucide-react";
import { useAdminOverviewStats } from "../hooks/useAdminData";
import { StatCard } from "@/components/shared/StatCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { Spinner } from "@/components/feedback/Loading";

export function AdminOverviewPage() {
  const { data: stats, isLoading } = useAdminOverviewStats();

  if (isLoading || !stats) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const cards = [
    { label: "إجمالي المستخدمين", value: stats.totalUsers, icon: Users, tone: "primary" as const },
    { label: "إجمالي الأطباء", value: stats.totalDoctors, icon: Stethoscope, tone: "primary" as const },
    { label: "إجمالي الممرضين", value: stats.totalNurses, icon: HeartPulse, tone: "primary" as const },
    { label: "حجوزات اليوم", value: stats.todayBookings, icon: CalendarClock, tone: "accent" as const },
    { label: "الحجوزات القادمة", value: stats.upcomingBookings, icon: CalendarClock, tone: "accent" as const },
    { label: "الطلبات المعلّقة", value: stats.pendingRequests, icon: Inbox, tone: "warning" as const },
    { label: "الحجوزات المكتملة", value: stats.completedBookings, icon: CheckCircle2, tone: "accent" as const },
  ];

  return (
    <div>
      <PageHeader title="نظرة عامة" description="ملخّص شامل لحالة المنصة الآن" />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {cards.map((card) => (
          <StatCard key={card.label} icon={card.icon} label={card.label} value={card.value} tone={card.tone} />
        ))}
      </div>
    </div>
  );
}
