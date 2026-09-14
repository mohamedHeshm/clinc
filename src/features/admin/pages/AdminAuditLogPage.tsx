import { History } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useAuditLog } from "../hooks/useAdminData";
import { Spinner } from "@/components/feedback/Loading";
import { EmptyState } from "@/components/feedback/EmptyState";

export function AdminAuditLogPage() {
  const { data: entries, isLoading } = useAuditLog();

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-foreground">سجل العمليات</h1>

      <div className="mt-6 space-y-2">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : !entries || entries.length === 0 ? (
          <EmptyState icon={History} title="لا توجد عمليات مسجّلة بعد" />
        ) : (
          entries.map((entry) => (
            <div key={entry.id} className="rounded-lg border border-border px-4 py-3 text-sm">
              <p className="text-foreground">{entry.description}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {entry.admin_name} — {format(new Date(entry.created_at), "d MMMM yyyy، h:mm a", { locale: ar })}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
