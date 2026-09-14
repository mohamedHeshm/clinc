/**
 * أنواع Database كاملة مكتوبة يدويًا لتطابق supabase/migrations بالضبط،
 * ليعمل الكود بأمان نوعي (Type Safety) حقيقي من الآن.
 *
 * بمجرد ربط مشروع Supabase حقيقي وتطبيق الـ Migrations، شغّل:
 *   npm run gen:types
 * وسيُستبدل هذا الملف تلقائيًا بنسخة مولَّدة من القاعدة الفعلية (الأدق دائمًا،
 * خصوصًا للـ Functions/RPC). حافظ على نفس التوقيعات هنا حتى ذلك الحين.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          phone: string;
          gender: "MALE" | "FEMALE" | null;
          address: string | null;
          avatar_url: string | null;
          role: "USER" | "DOCTOR" | "NURSE" | "ADMIN";
          status: "active" | "suspended";
          created_at: string;
          updated_at: string;
        };
        Insert: never; // يُدرَج فقط عبر trigger عند التسجيل — لا insert مباشر من العميل
        Update: Partial<{
          full_name: string;
          phone: string;
          gender: "MALE" | "FEMALE" | null;
          address: string | null;
          avatar_url: string | null;
        }>;
      };
      doctors: {
        Row: {
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
        };
        Insert: never; // فقط عبر admin_create_doctor RPC
        Update: Partial<{
          bio: string | null;
          clinic_address: string;
          clinic_latitude: number | null;
          clinic_longitude: number | null;
        }>;
      };
      nurses: {
        Row: {
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
        };
        Insert: never; // فقط عبر admin_create_nurse RPC
        Update: Partial<{
          bio: string | null;
          service_area: string[];
          base_latitude: number | null;
          base_longitude: number | null;
        }>;
      };
      services: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          applies_to: ("doctor" | "nurse")[];
          default_price: number | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["services"]["Row"]> & { name: string };
        Update: Partial<Database["public"]["Tables"]["services"]["Row"]>;
      };
      doctor_services: {
        Row: { doctor_id: string; service_id: string; price: number | null; created_at: string };
        Insert: { doctor_id: string; service_id: string; price?: number | null };
        Update: Partial<{ price: number | null }>;
      };
      nurse_services: {
        Row: { nurse_id: string; service_id: string; price: number | null; created_at: string };
        Insert: { nurse_id: string; service_id: string; price?: number | null };
        Update: Partial<{ price: number | null }>;
      };
      availability: {
        Row: {
          id: string;
          provider_id: string;
          provider_type: "doctor" | "nurse";
          day_of_week: number;
          start_time: string;
          end_time: string;
          is_available: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["availability"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["availability"]["Row"]>;
      };
      bookings: {
        Row: {
          id: string;
          patient_id: string;
          provider_id: string;
          provider_type: "doctor" | "nurse";
          service_id: string | null;
          booking_date: string;
          start_time: string;
          end_time: string;
          price: number;
          status:
            | "pending"
            | "accepted"
            | "rejected"
            | "confirmed"
            | "in_progress"
            | "completed"
            | "cancelled";
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: never; // استخدم دائمًا RPC create_booking
        Update: Partial<{ status: Database["public"]["Tables"]["bookings"]["Row"]["status"]; notes: string | null }>;
      };
      locations: {
        Row: {
          id: string;
          booking_id: string;
          latitude: number;
          longitude: number;
          address: string;
          notes: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["locations"]["Row"], "id" | "created_at">;
        Update: Partial<{ latitude: number; longitude: number; address: string; notes: string | null }>;
      };
      reviews: {
        Row: {
          id: string;
          booking_id: string;
          user_id: string;
          provider_id: string;
          provider_type: "doctor" | "nurse";
          rating: number;
          comment: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["reviews"]["Row"], "id" | "created_at">;
        Update: never; // التقييم نهائي
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          type: string;
          related_booking_id: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: never; // فقط عبر trigger notify_booking_event
        Update: Partial<{ is_read: boolean }>;
      };
      admin_actions: {
        Row: {
          id: string;
          admin_id: string;
          action_type: string;
          target_table: string | null;
          target_id: string | null;
          description: string;
          created_at: string;
        };
        Insert: never; // فقط عبر RPC الإدارية
        Update: never;
      };
    };
    Views: {
      doctors_public: {
        Row: {
          id: string;
          full_name: string;
          avatar_url: string | null;
          gender: "MALE" | "FEMALE" | null;
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
        };
      };
      nurses_public: {
        Row: {
          id: string;
          full_name: string;
          avatar_url: string | null;
          gender: "MALE" | "FEMALE" | null;
          bio: string | null;
          experience_years: number;
          service_area: string[];
          base_latitude: number | null;
          base_longitude: number | null;
          visit_price: number;
          rating_avg: number;
          rating_count: number;
          available_today: boolean;
        };
      };
    };
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
      get_available_slots: {
        Args: {
          p_provider_id: string;
          p_provider_type: "doctor" | "nurse";
          p_date: string;
          p_slot_minutes?: number;
        };
        Returns: { slot_start: string; slot_end: string; is_available: boolean }[];
      };
      create_booking: {
        Args: {
          p_provider_id: string;
          p_provider_type: "doctor" | "nurse";
          p_service_id: string | null;
          p_date: string;
          p_start: string;
          p_end: string;
          p_price: number;
          p_notes?: string | null;
        };
        Returns: Database["public"]["Tables"]["bookings"]["Row"];
      };
      admin_create_doctor: {
        Args: {
          p_profile_id: string;
          p_specialization: string;
          p_bio: string | null;
          p_experience_years: number;
          p_clinic_address: string;
          p_clinic_latitude: number | null;
          p_clinic_longitude: number | null;
          p_consultation_price: number;
        };
        Returns: Database["public"]["Tables"]["doctors"]["Row"];
      };
      admin_create_nurse: {
        Args: {
          p_profile_id: string;
          p_bio: string | null;
          p_experience_years: number;
          p_service_area: string[];
          p_visit_price: number;
          p_base_latitude?: number | null;
          p_base_longitude?: number | null;
        };
        Returns: Database["public"]["Tables"]["nurses"]["Row"];
      };
      admin_set_account_status: {
        Args: { p_profile_id: string; p_status: "active" | "suspended" };
        Returns: Database["public"]["Tables"]["profiles"]["Row"];
      };
      admin_log_action: {
        Args: {
          p_action_type: string;
          p_target_table: string;
          p_target_id: string;
          p_description: string;
        };
        Returns: void;
      };
    };
    Enums: {
      user_role: "USER" | "DOCTOR" | "NURSE" | "ADMIN";
      gender_type: "MALE" | "FEMALE";
      provider_kind: "doctor" | "nurse";
      account_status: "active" | "suspended";
      booking_status:
        | "pending"
        | "accepted"
        | "rejected"
        | "confirmed"
        | "in_progress"
        | "completed"
        | "cancelled";
      notification_type:
        | "booking_requested"
        | "booking_accepted"
        | "booking_rejected"
        | "booking_confirmed"
        | "booking_cancelled"
        | "booking_completed"
        | "review_available";
    };
  };
}
