import type { UserRole } from "@/types/enums";
import { ROUTES } from "@/constants/routes";

export function getPostLoginRoute(role: UserRole): string {
  switch (role) {
    case "ADMIN":
      return ROUTES.admin;
    case "DOCTOR":
    case "NURSE":
      return ROUTES.providerDashboard;
    case "USER":
    default:
      return ROUTES.dashboard;
  }
}
