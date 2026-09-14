import { supabase } from "@/lib/supabase";
import type { NursePublic } from "@/types/models";
import type { Gender } from "@/types/enums";
import { getProviderIdsAvailableToday } from "@/features/doctors/services/doctors.service";
import type { PagedResult } from "@/features/doctors/services/doctors.service";

export interface NurseFilters {
  search?: string;
  region?: string;
  priceMax?: number;
  ratingMin?: number;
  gender?: Gender;
  availableToday?: boolean;
  sortBy?: "rating" | "price_asc" | "price_desc" | "experience";
  page?: number;
  pageSize?: number;
}

const PAGE_SIZE_DEFAULT = 12;

export async function fetchNurses(filters: NurseFilters): Promise<PagedResult<NursePublic>> {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? PAGE_SIZE_DEFAULT;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase.from("nurses_public").select("*", { count: "exact" });

  if (filters.search?.trim()) {
    query = query.ilike("full_name", `%${filters.search.trim()}%`);
  }
  if (filters.region?.trim()) {
    query = query.contains("service_area", [filters.region.trim()]);
  }
  if (typeof filters.priceMax === "number") {
    query = query.lte("visit_price", filters.priceMax);
  }
  if (typeof filters.ratingMin === "number") {
    query = query.gte("rating_avg", filters.ratingMin);
  }
  if (filters.gender) {
    query = query.eq("gender", filters.gender);
  }

  if (filters.availableToday) {
    const availableIds = await getProviderIdsAvailableToday("nurse");
    if (availableIds.length === 0) {
      return { items: [], total: 0 };
    }
    query = query.in("id", availableIds);
  }

  switch (filters.sortBy) {
    case "price_asc":
      query = query.order("visit_price", { ascending: true });
      break;
    case "price_desc":
      query = query.order("visit_price", { ascending: false });
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

  return { items: (data ?? []) as NursePublic[], total: count ?? 0 };
}

export async function fetchNurseById(id: string): Promise<NursePublic | null> {
  const { data, error } = await supabase.from("nurses_public").select("*").eq("id", id).single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data as NursePublic;
}

/** كل الممرضين النشطين اللي عندهم موقع أساسي مسجَّل — للاستخدام في ترتيب "الأقرب إليك" فقط */
export async function fetchNursesWithLocation(): Promise<NursePublic[]> {
  const { data, error } = await supabase
    .from("nurses_public")
    .select("*")
    .not("base_latitude", "is", null)
    .not("base_longitude", "is", null);

  if (error) throw error;
  return (data ?? []) as NursePublic[];
}

export async function fetchNurseServiceAreas(): Promise<string[]> {
  const { data, error } = await supabase
    .from("nurses_public")
    .select("service_area");

  if (error) throw error;

  const unique = new Set(
    (data ?? [])
      .flatMap((nurse) => nurse.service_area ?? [])
      .filter((area): area is string => area !== null)
  );

  return Array.from(unique).sort();
}

export interface NurseServiceItem {
  service_id: string;
  name: string;
  description: string | null;
  price: number | null;
}

export async function fetchNurseServices(nurseId: string): Promise<NurseServiceItem[]> {
  const { data, error } = await supabase
    .from("nurse_services")
    .select("service_id, price, services(name, description)")
    .eq("nurse_id", nurseId);

  if (error) throw error;
  return (data ?? []).map((row) => ({
    service_id: row.service_id,
    price: row.price,
    name: (row.services as unknown as { name: string; description: string | null })?.name ?? "",
    description:
      (row.services as unknown as { name: string; description: string | null })?.description ?? null,
  }));
}
