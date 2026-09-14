// أنواع مركزية للأدوار وحالات النظام — يُعتمد عليها في كل الـ features
// ويجب أن تطابق تمامًا الـ ENUMs في قاعدة البيانات (المرحلة 3).

export const USER_ROLES = ["USER", "DOCTOR", "NURSE", "ADMIN"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const GENDERS = ["MALE", "FEMALE"] as const;
export type Gender = (typeof GENDERS)[number];

export const PROVIDER_TYPES = ["doctor", "nurse"] as const;
export type ProviderType = (typeof PROVIDER_TYPES)[number];

// آلة حالة الحجز — الانتقالات المسموحة موثّقة ومفروضة أيضًا
// عبر trigger في قاعدة البيانات (enforce_booking_status_transition).
export const BOOKING_STATUSES = [
  "pending",
  "accepted",
  "rejected",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const ACCOUNT_STATUSES = ["active", "suspended"] as const;
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

export const NOTIFICATION_TYPES = [
  "booking_requested",
  "booking_accepted",
  "booking_rejected",
  "booking_confirmed",
  "booking_cancelled",
  "booking_completed",
  "review_available",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];
