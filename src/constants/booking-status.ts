import type { BookingStatus } from "@/types/enums";
import type { BadgeProps } from "@/components/ui/badge";

/** تسميات مختصرة تُستخدم في الـ Badge (بطاقات القوائم) */
export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "قيد المراجعة",
  accepted: "تم التأكيد",
  rejected: "تم الرفض",
  confirmed: "مؤكَّد",
  in_progress: "جارٍ التنفيذ",
  completed: "مكتمل",
  cancelled: "ملغي",
};

/** جمل كاملة أوضح — تُستخدم في صفحات التفاصيل حيث توجد مساحة أكبر للشرح */
export const BOOKING_STATUS_DESCRIPTIONS: Record<BookingStatus, string> = {
  pending: "في انتظار تأكيد الطبيب أو الممرض",
  accepted: "تم تأكيد الموعد",
  rejected: "تم رفض هذا الحجز",
  confirmed: "تم تأكيد الموعد",
  in_progress: "الخدمة جارية الآن",
  completed: "اكتمل الموعد",
  cancelled: "تم إلغاء الموعد",
};

export const BOOKING_STATUS_VARIANT: Record<BookingStatus, NonNullable<BadgeProps["variant"]>> = {
  pending: "warning",
  accepted: "primary",
  rejected: "destructive",
  confirmed: "primary",
  in_progress: "primary",
  completed: "success",
  cancelled: "neutral",
};

/** الحالات اللي يصبح فيها الإلغاء ممكنًا فعليًا — بعد القبول فقط، أبدًا
 * وهي مطابقة تمامًا لِما تفرضه قاعدة البيانات (enforce_booking_status_transition) */
export const CANCELLABLE_BOOKING_STATUSES: readonly BookingStatus[] = ["accepted", "confirmed"];
