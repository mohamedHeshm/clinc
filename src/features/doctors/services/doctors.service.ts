import { supabase } from "@/lib/supabase";
import type { DoctorPublic } from "@/types/models";
import type { Gender } from "@/types/enums";

export interface DoctorFilters {
  search?: string;
  specialization?: string;
  priceMax?: number;
  ratingMin?: number;
  gender?: Gender;
  availableToday?: boolean;
  sortBy?: "rating" | "price_asc" | "price_desc" | "experience";
  page?: number;
  pageSize?: number;
}

export interface PagedResult<T> {
  items: T[];
  total: number;
}

const PAGE_SIZE_DEFAULT = 12;

export async function fetchDoctors(filters: DoctorFilters): Promise<PagedResult<DoctorPublic>> {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? PAGE_SIZE_DEFAULT;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase.from("doctors_public").select("*", { count: "exact" });

  if (filters.search?.trim()) {
    const term = filters.search.trim();
    query = query.or(`full_name.ilike.%${term}%,specialization.ilike.%${term}%`);
  }
  if (filters.specialization) {
    query = query.eq("specialization", filters.specialization);
  }
  if (typeof filters.priceMax === "number") {
    query = query.lte("consultation_price", filters.priceMax);
  }
  if (typeof filters.ratingMin === "number") {
    query = query.gte("rating_avg", filters.ratingMin);
  }
  if (filters.gender) {
    query = query.eq("gender", filters.gender);
  }

  if (filters.availableToday) {
    const availableIds = await getProviderIdsAvailableToday("doctor");
    if (availableIds.length === 0) {
      return { items: [], total: 0 };
    }
    query = query.in("id", availableIds);
  }

  switch (filters.sortBy) {
    case "price_asc":
      query = query.order("consultation_price", { ascending: true });
      break;
    case "price_desc":
      query = query.order("consultation_price", { ascending: false });
      break;
    case "experience":
      query = query.order("experience_years", { ascending: false });
      break;
    case "rating":
    default:
      query = query.order("rating_avg", { ascending: false });
  }

  const { data, error, count } = await query.range(from, to);
  if (error) throw error;

  return { items: (data ?? []) as DoctorPublic[], total: count ?? 0 };
}

export async function fetchDoctorById(id: string): Promise<DoctorPublic | null> {
  const { data, error } = await supabase.from("doctors_public").select("*").eq("id", id).single();
  if (error) {
    if (error.code === "PGRST116") return null; // لا يوجد صف مطابق
    throw error;
  }
  return data as DoctorPublic;
}

export async function fetchDoctorSpecializations(): Promise<string[]> {
  const { data, error } = await supabase.from("doctors_public").select("specialization");
  if (error) throw error;
  const unique = new Set((data ?? []).map((d) => d.specialization));
  return Array.from(unique).sort();
}

export interface DoctorServiceItem {
  service_id: string;
  name: string;
  description: string | null;
  price: number | null;
}

export async function fetchDoctorServices(doctorId: string): Promise<DoctorServiceItem[]> {
  const { data, error } = await supabase
    .from("doctor_services")
    .select("service_id, price, services(name, description)")
    .eq("doctor_id", doctorId);

  if (error) throw error;
  return (data ?? []).map((row) => ({
    service_id: row.service_id,
    price: row.price,
    name: (row.services as unknown as { name: string; description: string | null })?.name ?? "",
    description:
      (row.services as unknown as { name: string; description: string | null })?.description ?? null,
  }));
}

/** يُستخدم أيضًا في خدمة الممرضين — قائمة provider_id لديهم availability اليوم */
export async function getProviderIdsAvailableToday(
  providerType: "doctor" | "nurse"
): Promise<string[]> {
  const todayDow = new Date().getDay(); // 0=الأحد .. 6=السبت (متوافق مع day_of_week بالقاعدة)
  const { data, error } = await supabase
    .from("availability")
    .select("provider_id")
    .eq("provider_type", providerType)
    .eq("day_of_week", todayDow)
    .eq("is_available", true);

  if (error) throw error;
  return Array.from(new Set((data ?? []).map((row) => row.provider_id)));
}
