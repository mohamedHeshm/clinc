import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutGrid,
  Inbox,
  Calendar as CalendarIcon,
  ListChecks,
  Clock,
  Star,
  Wallet,
  Settings,
  ClipboardList,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { to: ROUTES.providerDashboard, label: "نظرة عامة", icon: LayoutGrid, end: true },
  { to: ROUTES.providerRequests, label: "الطلبات", icon: Inbox },
  { to: ROUTES.providerCalendar, label: "التقويم", icon: CalendarIcon },
  { to: ROUTES.providerBookings, label: "الحجوزات", icon: ListChecks },
  { to: ROUTES.providerAvailability, label: "أوقات التوفر", icon: Clock },
  { to: ROUTES.providerServices, label: "خدماتي وأسعاري", icon: ClipboardList },
  { to: ROUTES.providerReviews, label: "التقييمات", icon: Star },
  { to: ROUTES.providerRevenue, label: "الإيرادات", icon: Wallet },
  { to: ROUTES.dashboardSettings, label: "الإعدادات", icon: Settings },
];

// أهم 4 مهام يومية تُستخدم بكثرة — تبقى ثابتة في شريط الموبايل السفلي
const BOTTOM_NAV_ITEMS = NAV_ITEMS.slice(0, 4);
// باقي الصفحات (أوقات التوفر، الخدمات، التقييمات، الإيرادات، الإعدادات)
// تظهر في شريط علوي قابل للتمرير أفقيًا على الموبايل، عشان تفضل كلها
// قابلة للوصول بسهولة من غير ما تزحم الشريط السفلي.
const SECONDARY_NAV_ITEMS = NAV_ITEMS.slice(4);

export function ProviderLayout() {
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

        <div className="min-w-0 flex-1 pb-20 md:pb-0">
          <nav className="mb-6 flex gap-1 overflow-x-auto pb-1 md:hidden">
            {SECONDARY_NAV_ITEMS.map((item) => (
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

          <main>
            <Outlet />
          </main>
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-border bg-surface md:hidden">
        {BOTTOM_NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] text-muted-foreground",
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
