import type {
  AccountStatus,
  BookingStatus,
  Gender,
  NotificationType,
  ProviderType,
  UserRole,
} from "./enums";

/**
 * هذه الأنواع مكتوبة يدويًا لتطابق ملفات الـ SQL Migrations في
 * supabase/migrations بالضبط. بمجرد ربط مشروع Supabase حقيقي، شغّل:
 *   npm run gen:types
 * وسيتم توليد src/types/database.types.ts تلقائيًا من القاعدة الفعلية.
 * حينها فضّل الاستيراد من Database['public']['Tables'][...]['Row']
 * بدل هذا الملف لضمان التطابق التام، أو أبقِ عليه كطبقة نوع مبسّطة
 * فوق الأنواع المولّدة — القرار يُتّخذ في المرحلة اللي بيتفعّل فيها ده.
 */

export interface Profile {
  id: string;
  full_name: string;
  phone: string;
  gender: Gender | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  avatar_url: string | null;
  role: UserRole;
  status: AccountStatus;
  created_at: string;
  updated_at: string;
}

export interface Doctor {
  id: string;
  profile_id: string;
  specialization: string;
  bio: string | null;
  experience_years: number;
  clinic_address: string;
  clinic_latitude: number | null;
  clinic_longitude: number | null;
  consultation_price: number;
  is_active: boolean;
  rating_avg: number;
  rating_count: number;
  created_at: string;
  updated_at: string;
}

export interface Nurse {
  id: string;
  profile_id: string;
  bio: string | null;
  experience_years: number;
  service_area: string[];
  base_latitude: number | null;
  base_longitude: number | null;
  visit_price: number;
  is_active: boolean;
  rating_avg: number;
  rating_count: number;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  name: string;
  description: string | null;
  applies_to: ProviderType[];
  default_price: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Availability {
  id: string;
  provider_id: string;
  provider_type: ProviderType;
  day_of_week: number; // 0=الأحد .. 6=السبت
  start_time: string; // "HH:MM:SS"
  end_time: string;
  is_available: boolean;
}

export interface Booking {
  id: string;
  patient_id: string;
  provider_id: string;
  provider_type: ProviderType;
  service_id: string | null;
  booking_date: string; // "YYYY-MM-DD"
  start_time: string;
  end_time: string;
  price: number;
  status: BookingStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface BookingLocation {
  id: string;
  booking_id: string;
  latitude: number;
  longitude: number;
  address: string;
  notes: string | null;
  created_at: string;
}

export interface Review {
  id: string;
  booking_id: string;
  user_id: string;
  provider_id: string;
  provider_type: ProviderType;
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string | null;
  created_at: string;
}

export interface AppNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  related_booking_id: string | null;
  is_read: boolean;
  created_at: string;
}

/** يطابق view doctors_public — يُستخدم في كل صفحات التصفح العامة */
export interface DoctorPublic {
  id: string;
  full_name: string;
  avatar_url: string | null;
  gender: Gender | null;
  specialization: string;
  bio: string | null;
  experience_years: number;
  clinic_address: string;
  clinic_latitude: number | null;
  clinic_longitude: number | null;
  consultation_price: number;
  rating_avg: number;
  rating_count: number;
  available_today: boolean;
}

/** يطابق view nurses_public */
export interface NursePublic {
  id: string;
  full_name: string;
  avatar_url: string | null;
  gender: Gender | null;
  bio: string | null;
  experience_years: number;
  service_area: string[];
  base_latitude: number | null;
  base_longitude: number | null;
  visit_price: number;
  rating_avg: number;
  rating_count: number;
  available_today: boolean;
}
