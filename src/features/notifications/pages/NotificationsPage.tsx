import { Bell as BellIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import {
  useNotifications,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
} from "../hooks/useNotifications";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Skeleton } from "@/components/feedback/Loading";
import { cn } from "@/lib/utils";

export function NotificationsPage() {
  const { data: notifications, isLoading } = useNotifications();
  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();

  const hasUnread = notifications?.some((n) => !n.is_read);

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">الإشعارات</h1>
        {hasUnread && (
          <Button variant="ghost" size="sm" onClick={() => markAllAsRead.mutate()}>
            تعليم الكل كمقروء
          </Button>
        )}
      </div>

      <div className="mt-6 space-y-2">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)
        ) : !notifications || notifications.length === 0 ? (
          <EmptyState icon={BellIcon} title="لا توجد إشعارات بعد" />
        ) : (
          notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => {
                if (!n.is_read) markAsRead.mutate(n.id);
              }}
              className={cn(
                "block w-full rounded-lg border border-border p-4 text-right transition-colors hover:bg-surface-muted",
                !n.is_read && "bg-primary-subtle/40"
              )}
            >
              <p className="text-sm font-medium text-foreground">{n.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{n.message}</p>
              <p className="mt-1.5 text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ar })}
              </p>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
