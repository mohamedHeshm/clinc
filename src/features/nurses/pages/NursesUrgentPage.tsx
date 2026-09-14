import { Link } from "react-router-dom";
import { AlertTriangle, Zap } from "lucide-react";
import { useNurses } from "@/features/nurses/hooks/useNurses";
import { NurseCard } from "@/features/nurses/components/NurseCard";
import { CardSkeleton } from "@/components/feedback/Loading";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";

export function NursesUrgentPage() {
  const { data, isLoading, isError, refetch } = useNurses({
    availableToday: true,
    sortBy: "rating",
    pageSize: 50,
  });

  return (
    <div className="container max-w-2xl py-10">
      <div className="flex items-center gap-2">
        <Zap className="h-5 w-5 text-warning" />
        <h1 className="text-2xl font-semibold text-foreground">طلب تمريض عاجل</h1>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        الممرضون المتاحون اليوم فقط — بترتيب الأعلى تقييمًا أولًا
      </p>

      <div className="mt-5 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-foreground">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
        <p>
          <strong>هذه الخدمة ليست بديلًا عن الإسعاف أو الطوارئ الطبية.</strong> في الحالات
          الطارئة اتصل بخدمات الطوارئ المحلية فورًا.
        </p>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : data && data.items.length > 0 ? (
          <div className="space-y-4">
            {data.items.map((nurse) => (
              <NurseCard key={nurse.id} nurse={nurse} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="لا يوجد ممرضون متاحون الآن"
            description="جرّب طلب زيارة منزلية عادية بموعد لاحق بدلًا من ذلك"
            action={
              <Link to="/nurses" className="text-sm text-primary hover:underline">
                تصفّح كل الممرضين
              </Link>
            }
          />
        )}
      </div>
    </div>
  );
}
