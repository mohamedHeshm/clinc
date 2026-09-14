export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_actions: {
        Row: {
          action_type: string
          admin_id: string
          created_at: string
          description: string
          id: string
          target_id: string | null
          target_table: string | null
        }
        Insert: {
          action_type: string
          admin_id: string
          created_at?: string
          description: string
          id?: string
          target_id?: string | null
          target_table?: string | null
        }
        Update: {
          action_type?: string
          admin_id?: string
          created_at?: string
          description?: string
          id?: string
          target_id?: string | null
          target_table?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_actions_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      availability: {
        Row: {
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          is_available: boolean
          provider_id: string
          provider_type: Database["public"]["Enums"]["provider_kind"]
          start_time: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          is_available?: boolean
          provider_id: string
          provider_type: Database["public"]["Enums"]["provider_kind"]
          start_time: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_available?: boolean
          provider_id?: string
          provider_type?: Database["public"]["Enums"]["provider_kind"]
          start_time?: string
          updated_at?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          booking_date: string
          created_at: string
          end_time: string
          id: string
          notes: string | null
          patient_id: string
          price: number
          provider_id: string
          provider_type: Database["public"]["Enums"]["provider_kind"]
          service_id: string | null
          start_time: string
          status: Database["public"]["Enums"]["booking_status"]
          time_range: unknown
          updated_at: string
        }
        Insert: {
          booking_date: string
          created_at?: string
          end_time: string
          id?: string
          notes?: string | null
          patient_id: string
          price: number
          provider_id: string
          provider_type: Database["public"]["Enums"]["provider_kind"]
          service_id?: string | null
          start_time: string
          status?: Database["public"]["Enums"]["booking_status"]
          time_range?: unknown
          updated_at?: string
        }
        Update: {
          booking_date?: string
          created_at?: string
          end_time?: string
          id?: string
          notes?: string | null
          patient_id?: string
          price?: number
          provider_id?: string
          provider_type?: Database["public"]["Enums"]["provider_kind"]
          service_id?: string | null
          start_time?: string
          status?: Database["public"]["Enums"]["booking_status"]
          time_range?: unknown
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_services: {
        Row: {
          created_at: string
          doctor_id: string
          price: number | null
          service_id: string
        }
        Insert: {
          created_at?: string
          doctor_id: string
          price?: number | null
          service_id: string
        }
        Update: {
          created_at?: string
          doctor_id?: string
          price?: number | null
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_services_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_services_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      doctors: {
        Row: {
          bio: string | null
          clinic_address: string
          clinic_latitude: number | null
          clinic_longitude: number | null
          consultation_price: number
          created_at: string
          experience_years: number
          id: string
          is_active: boolean
          profile_id: string
          rating_avg: number
          rating_count: number
          specialization: string
          updated_at: string
        }
        Insert: {
          bio?: string | null
          clinic_address: string
          clinic_latitude?: number | null
          clinic_longitude?: number | null
          consultation_price: number
          created_at?: string
          experience_years?: number
          id?: string
          is_active?: boolean
          profile_id: string
          rating_avg?: number
          rating_count?: number
          specialization: string
          updated_at?: string
        }
        Update: {
          bio?: string | null
          clinic_address?: string
          clinic_latitude?: number | null
          clinic_longitude?: number | null
          consultation_price?: number
          created_at?: string
          experience_years?: number
          id?: string
          is_active?: boolean
          profile_id?: string
          rating_avg?: number
          rating_count?: number
          specialization?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctors_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          address: string
          booking_id: string
          created_at: string
          id: string
          latitude: number
          longitude: number
          notes: string | null
        }
        Insert: {
          address: string
          booking_id: string
          created_at?: string
          id?: string
          latitude: number
          longitude: number
          notes?: string | null
        }
        Update: {
          address?: string
          booking_id?: string
          created_at?: string
          id?: string
          latitude?: number
          longitude?: number
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "locations_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          related_booking_id: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          related_booking_id?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          related_booking_id?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_related_booking_id_fkey"
            columns: ["related_booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      nurse_services: {
        Row: {
          created_at: string
          nurse_id: string
          price: number | null
          service_id: string
        }
        Insert: {
          created_at?: string
          nurse_id: string
          price?: number | null
          service_id: string
        }
        Update: {
          created_at?: string
          nurse_id?: string
          price?: number | null
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nurse_services_nurse_id_fkey"
            columns: ["nurse_id"]
            isOneToOne: false
            referencedRelation: "nurses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nurse_services_nurse_id_fkey"
            columns: ["nurse_id"]
            isOneToOne: false
            referencedRelation: "nurses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nurse_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      nurses: {
        Row: {
          base_latitude: number | null
          base_longitude: number | null
          bio: string | null
          created_at: string
          experience_years: number
          id: string
          is_active: boolean
          profile_id: string
          rating_avg: number
          rating_count: number
          service_area: string[]
          updated_at: string
          visit_price: number
        }
        Insert: {
          base_latitude?: number | null
          base_longitude?: number | null
          bio?: string | null
          created_at?: string
          experience_years?: number
          id?: string
          is_active?: boolean
          profile_id: string
          rating_avg?: number
          rating_count?: number
          service_area?: string[]
          updated_at?: string
          visit_price: number
        }
        Update: {
          base_latitude?: number | null
          base_longitude?: number | null
          bio?: string | null
          created_at?: string
          experience_years?: number
          id?: string
          is_active?: boolean
          profile_id?: string
          rating_avg?: number
          rating_count?: number
          service_area?: string[]
          updated_at?: string
          visit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "nurses_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          created_at: string
          full_name: string
          gender: Database["public"]["Enums"]["gender_type"] | null
          id: string
          phone: string
          role: Database["public"]["Enums"]["user_role"]
          status: Database["public"]["Enums"]["account_status"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          full_name: string
          gender?: Database["public"]["Enums"]["gender_type"] | null
          id: string
          phone: string
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["account_status"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          gender?: Database["public"]["Enums"]["gender_type"] | null
          id?: string
          phone?: string
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["account_status"]
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          booking_id: string
          comment: string | null
          created_at: string
          id: string
          provider_id: string
          provider_type: Database["public"]["Enums"]["provider_kind"]
          rating: number
          user_id: string
        }
        Insert: {
          booking_id: string
          comment?: string | null
          created_at?: string
          id?: string
          provider_id: string
          provider_type: Database["public"]["Enums"]["provider_kind"]
          rating: number
          user_id: string
        }
        Update: {
          booking_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          provider_id?: string
          provider_type?: Database["public"]["Enums"]["provider_kind"]
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          applies_to: Database["public"]["Enums"]["provider_kind"][]
          created_at: string
          default_price: number | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          applies_to?: Database["public"]["Enums"]["provider_kind"][]
          created_at?: string
          default_price?: number | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          applies_to?: Database["public"]["Enums"]["provider_kind"][]
          created_at?: string
          default_price?: number | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      doctors_public: {
        Row: {
          available_today: boolean | null
          avatar_url: string | null
          bio: string | null
          clinic_address: string | null
          clinic_latitude: number | null
          clinic_longitude: number | null
          consultation_price: number | null
          experience_years: number | null
          full_name: string | null
          gender: Database["public"]["Enums"]["gender_type"] | null
          id: string | null
          rating_avg: number | null
          rating_count: number | null
          specialization: string | null
        }
        Relationships: []
      }
      nurses_public: {
        Row: {
          available_today: boolean | null
          avatar_url: string | null
          base_latitude: number | null
          base_longitude: number | null
          bio: string | null
          experience_years: number | null
          full_name: string | null
          gender: Database["public"]["Enums"]["gender_type"] | null
          id: string | null
          rating_avg: number | null
          rating_count: number | null
          service_area: string[] | null
          visit_price: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_create_doctor: {
        Args: {
          p_bio: string
          p_clinic_address: string
          p_clinic_latitude: number
          p_clinic_longitude: number
          p_consultation_price: number
          p_experience_years: number
          p_profile_id: string
          p_specialization: string
        }
        Returns: {
          bio: string | null
          clinic_address: string
          clinic_latitude: number | null
          clinic_longitude: number | null
          consultation_price: number
          created_at: string
          experience_years: number
          id: string
          is_active: boolean
          profile_id: string
          rating_avg: number
          rating_count: number
          specialization: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "doctors"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_create_nurse:
        | {
            Args: {
              p_bio: string
              p_experience_years: number
              p_profile_id: string
              p_service_area: string[]
              p_visit_price: number
            }
            Returns: {
              base_latitude: number | null
              base_longitude: number | null
              bio: string | null
              created_at: string
              experience_years: number
              id: string
              is_active: boolean
              profile_id: string
              rating_avg: number
              rating_count: number
              service_area: string[]
              updated_at: string
              visit_price: number
            }
            SetofOptions: {
              from: "*"
              to: "nurses"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: {
              p_base_latitude?: number
              p_base_longitude?: number
              p_bio: string
              p_experience_years: number
              p_profile_id: string
              p_service_area: string[]
              p_visit_price: number
            }
            Returns: {
              base_latitude: number | null
              base_longitude: number | null
              bio: string | null
              created_at: string
              experience_years: number
              id: string
              is_active: boolean
              profile_id: string
              rating_avg: number
              rating_count: number
              service_area: string[]
              updated_at: string
              visit_price: number
            }
            SetofOptions: {
              from: "*"
              to: "nurses"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      admin_log_action: {
        Args: {
          p_action_type: string
          p_description: string
          p_target_id: string
          p_target_table: string
        }
        Returns: undefined
      }
      admin_set_account_status: {
        Args: {
          p_profile_id: string
          p_status: Database["public"]["Enums"]["account_status"]
        }
        Returns: {
          address: string | null
          avatar_url: string | null
          created_at: string
          full_name: string
          gender: Database["public"]["Enums"]["gender_type"] | null
          id: string
          phone: string
          role: Database["public"]["Enums"]["user_role"]
          status: Database["public"]["Enums"]["account_status"]
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_booking: {
        Args: {
          p_date: string
          p_end: string
          p_notes?: string
          p_price: number
          p_provider_id: string
          p_provider_type: Database["public"]["Enums"]["provider_kind"]
          p_service_id: string
          p_start: string
        }
        Returns: {
          booking_date: string
          created_at: string
          end_time: string
          id: string
          notes: string | null
          patient_id: string
          price: number
          provider_id: string
          provider_type: Database["public"]["Enums"]["provider_kind"]
          service_id: string | null
          start_time: string
          status: Database["public"]["Enums"]["booking_status"]
          time_range: unknown
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "bookings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_available_slots: {
        Args: {
          p_date: string
          p_provider_id: string
          p_provider_type: Database["public"]["Enums"]["provider_kind"]
          p_slot_minutes?: number
        }
        Returns: {
          is_available: boolean
          slot_end: string
          slot_start: string
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      account_status: "active" | "suspended"
      booking_status:
        | "pending"
        | "accepted"
        | "rejected"
        | "confirmed"
        | "in_progress"
        | "completed"
        | "cancelled"
      gender_type: "MALE" | "FEMALE"
      notification_type:
        | "booking_requested"
        | "booking_accepted"
        | "booking_rejected"
        | "booking_confirmed"
        | "booking_cancelled"
        | "booking_completed"
        | "review_available"
      provider_kind: "doctor" | "nurse"
      user_role: "USER" | "DOCTOR" | "NURSE" | "ADMIN"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      account_status: ["active", "suspended"],
      booking_status: [
        "pending",
        "accepted",
        "rejected",
        "confirmed",
        "in_progress",
        "completed",
        "cancelled",
      ],
      gender_type: ["MALE", "FEMALE"],
      notification_type: [
        "booking_requested",
        "booking_accepted",
        "booking_rejected",
        "booking_confirmed",
        "booking_cancelled",
        "booking_completed",
        "review_available",
      ],
      provider_kind: ["doctor", "nurse"],
      user_role: ["USER", "DOCTOR", "NURSE", "ADMIN"],
    },
  },
} as const
