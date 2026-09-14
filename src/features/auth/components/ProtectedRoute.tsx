import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ROUTES } from "@/constants/routes";
import type { UserRole } from "@/types/enums";

interface ProtectedRouteProps {
  allowedRoles: UserRole[];
  children: ReactNode;
}

/**
 * حاجز الواجهة الأول لحماية المسارات (تجربة مستخدم فقط — التوجيه/الإخفاء).
 * الحاجز الحقيقي غير القابل للالتفاف عليه هو RLS في قاعدة البيانات
 * (المرحلة 5) — هذا المكوّن لا يُغني عنه إطلاقًا.
 */
export function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const { session, profile, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!session || !profile) {
    return <Navigate to={ROUTES.login} state={{ from: location }} replace />;
  }

  if (profile.status === "suspended") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4 text-center">
        <p className="max-w-sm text-sm text-muted-foreground">
          تم إيقاف هذا الحساب مؤقتًا. برجاء التواصل مع الدعم لمزيد من التفاصيل.
        </p>
      </div>
    );
  }

  if (!allowedRoles.includes(profile.role)) {
    return <Navigate to={ROUTES.home} replace />;
  }

  return <>{children}</>;
}
