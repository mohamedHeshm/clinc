import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ROUTES } from "@/constants/routes";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NotificationBell } from "@/features/notifications/components/NotificationBell";
import { getPostLoginRoute } from "@/features/auth/utils/post-login-route";
import { cn } from "@/lib/utils";

const PUBLIC_NAV_LINKS = [
  { to: ROUTES.home, label: "الرئيسية" },
  { to: ROUTES.doctors, label: "الأطباء" },
  { to: ROUTES.nurses, label: "التمريض المنزلي" },
  { to: ROUTES.howItWorks, label: "كيف تعمل المنصة" },
  { to: ROUTES.about, label: "عن المنصة" },
];

const USER_NAV_LINKS = [
  { to: ROUTES.home, label: "الرئيسية" },
  { to: ROUTES.doctors, label: "الأطباء" },
  { to: ROUTES.nurses, label: "التمريض المنزلي" },
  { to: ROUTES.dashboardBookings, label: "حجوزاتي" },
];

export function Navbar() {
  const { session, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Navbar تبقى Minimal: الروابط العامة لأي زائر، وتتغيّر لتضم "حجوزاتي"
  // بدل الروابط التعريفية (كيف تعمل المنصة/عن المنصة) لو المستخدم دوره
  // USER تحديدًا — الأدوار التانية (طبيب/ممرض/أدمن) عندهم Sidebar خاص بيهم
  // فمش محتاجين رابط حجوزات هنا.
  const NAV_LINKS = session && profile?.role === "USER" ? USER_NAV_LINKS : PUBLIC_NAV_LINKS;

  const handleSignOut = async () => {
    await signOut();
    setIsMobileOpen(false);
    navigate(ROUTES.home);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <Link to={ROUTES.home} className="text-lg font-bold tracking-tight text-primary">
          Clinic
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  "rounded px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                  isActive && "text-foreground"
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {session && profile ? (
            <>
              <NotificationBell />
              <button
                onClick={() => navigate(getPostLoginRoute(profile.role))}
                className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-sm font-medium text-foreground hover:bg-surface-muted"
              >
                {profile.full_name}
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile.avatar_url ?? undefined} alt={profile.full_name} />
                  <AvatarFallback>{profile.full_name.charAt(0)}</AvatarFallback>
                </Avatar>
              </button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to={ROUTES.login}>تسجيل الدخول</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to={ROUTES.doctors}>حجز موعد</Link>
              </Button>
            </>
          )}
        </div>

        <button
          className="rounded p-2 text-foreground md:hidden"
          aria-label="فتح القائمة"
          onClick={() => setIsMobileOpen((v) => !v)}
        >
          {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {isMobileOpen && (
        <div className="border-t border-border bg-surface px-4 pb-4 md:hidden">
          <nav className="flex flex-col">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setIsMobileOpen(false)}
                className="rounded px-2 py-3 text-sm font-medium text-foreground hover:bg-surface-muted"
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
            {session && profile ? (
              <>
                <Button variant="outline" onClick={() => navigate(getPostLoginRoute(profile.role))}>
                  {profile.full_name}
                </Button>
                <Button variant="outline" asChild>
                  <Link to={ROUTES.dashboardNotifications} onClick={() => setIsMobileOpen(false)}>
                    الإشعارات
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to={ROUTES.dashboardProfile} onClick={() => setIsMobileOpen(false)}>
                    الملف الشخصي
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to={ROUTES.dashboardSettings} onClick={() => setIsMobileOpen(false)}>
                    الإعدادات
                  </Link>
                </Button>
                <Button variant="ghost" onClick={handleSignOut}>
                  تسجيل الخروج
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" asChild>
                  <Link to={ROUTES.login} onClick={() => setIsMobileOpen(false)}>
                    تسجيل الدخول
                  </Link>
                </Button>
                <Button asChild>
                  <Link to={ROUTES.doctors} onClick={() => setIsMobileOpen(false)}>
                    حجز موعد
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
