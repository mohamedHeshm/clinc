import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutGrid,
  Stethoscope,
  HeartPulse,
  Users,
  ClipboardList,
  ListChecks,
  BarChart3,
  History,
  Settings,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { to: ROUTES.admin, label: "نظرة عامة", icon: LayoutGrid, end: true },
  { to: ROUTES.adminDoctors, label: "الأطباء", icon: Stethoscope },
  { to: ROUTES.adminNurses, label: "الممرضون", icon: HeartPulse },
  { to: ROUTES.adminUsers, label: "المستخدمون", icon: Users },
  { to: ROUTES.adminServices, label: "الخدمات", icon: ClipboardList },
  { to: ROUTES.adminBookings, label: "الحجوزات", icon: ListChecks },
  { to: ROUTES.adminAnalytics, label: "الإحصائيات", icon: BarChart3 },
  { to: ROUTES.adminAuditLog, label: "سجل العمليات", icon: History },
  { to: ROUTES.dashboardSettings, label: "الإعدادات", icon: Settings },
];

export function AdminLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <div className="container flex flex-1 gap-8 py-6">
        <aside className="hidden w-60 shrink-0 lg:block">
          <nav className="sticky top-24 space-y-1 rounded-2xl border border-border bg-surface p-2 shadow-soft">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-surface-muted hover:text-foreground",
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

        {/* على الشاشات الأصغر من lg: تبويب أفقي قابل للتمرير بدل Sidebar */}
        <div className="min-w-0 flex-1">
          <nav className="mb-6 flex gap-1 overflow-x-auto pb-1 lg:hidden">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "shrink-0 rounded-full border border-border px-3.5 py-1.5 text-xs font-medium text-muted-foreground",
                    isActive && "border-primary bg-primary-subtle text-primary"
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <Outlet />
        </div>
      </div>
    </div>
  );
}
