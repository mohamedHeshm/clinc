import { useState } from "react";
import { Link } from "react-router-dom";
import { Bell } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { useNotifications, useMarkNotificationAsRead } from "../hooks/useNotifications";
import { EmptyState } from "@/components/feedback/EmptyState";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: notifications } = useNotifications();
  const markAsRead = useMarkNotificationAsRead();

  const unreadCount = notifications?.filter((n) => !n.is_read).length ?? 0;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className="relative rounded-full p-2 text-muted-foreground hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="الإشعارات"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute left-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80">
        <div className="border-b border-border p-3">
          <p className="text-sm font-semibold text-foreground">الإشعارات</p>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {!notifications || notifications.length === 0 ? (
            <EmptyState title="لا توجد إشعارات بعد" className="py-8" />
          ) : (
            notifications.slice(0, 10).map((n) => (
              <button
                key={n.id}
                onClick={() => {
                  if (!n.is_read) markAsRead.mutate(n.id);
                }}
                className={cn(
                  "block w-full border-b border-border p-3 text-right text-sm hover:bg-surface-muted",
                  !n.is_read && "bg-primary-subtle/40"
                )}
              >
                <p className="font-medium text-foreground">{n.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{n.message}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ar })}
                </p>
              </button>
            ))
          )}
        </div>

        <Link
          to={ROUTES.dashboardNotifications}
          onClick={() => setIsOpen(false)}
          className="block p-3 text-center text-sm text-primary hover:underline"
        >
          عرض كل الإشعارات
        </Link>
      </PopoverContent>
    </Popover>
  );
}

