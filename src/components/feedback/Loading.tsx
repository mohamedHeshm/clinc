import { cn } from "@/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return (
    <div
      role="status"
      aria-label="جارٍ التحميل"
      className={cn(
        "h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent text-primary",
        className
      )}
    />
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded bg-surface-muted", className)} />;
}

/** صف Skeleton جاهز لاستخدامه أثناء تحميل قوائم البطاقات (أطباء/ممرضين) */
export function CardSkeleton() {
  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-14 w-14 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <Skeleton className="mt-4 h-3 w-full" />
      <Skeleton className="mt-2 h-3 w-4/5" />
    </div>
  );
}
