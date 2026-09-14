import { NavLink, Outlet } from "react-router-dom";
import { LayoutGrid, CalendarCheck, Bell, User, Settings } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { to: ROUTES.dashboard, label: "نظرة عامة", icon: LayoutGrid, end: true },
  { to: ROUTES.dashboardBookings, label: "حجوزاتي", icon: CalendarCheck },
  { to: ROUTES.dashboardNotifications, label: "الإشعارات", icon: Bell },
  { to: ROUTES.dashboardProfile, label: "الملف الشخصي", icon: User },
  { to: ROUTES.dashboardSettings, label: "الإعدادات", icon: Settings },
];

export function DashboardLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <div className="container flex flex-1 gap-8 py-6">
        <aside className="hidden w-56 shrink-0 md:block">
          <nav className="sticky top-24 space-y-1">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2.5 rounded px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-surface-muted hover:text-foreground",
                    isActive && "bg-primary-subtle text-primary hover:bg-primary-subtle hover:text-primary"
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 pb-24 md:pb-0">
          <Outlet />
        </main>
      </div>

      {/* Bottom Navigation — موبايل فقط */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                "flex min-w-0 flex-1 flex-col items-center gap-1 px-1 py-2.5 text-[10px] text-muted-foreground",
                isActive && "text-primary"
              )
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
