import { supabase } from "@/lib/supabase";
import type { Service } from "@/types/models";
import type { ProviderType } from "@/types/enums";

/** كتالوج الخدمات المتاحة لنوع مقدّم الخدمة (طبيب أو ممرض) — من الكتالوج العام النشط */
export async function fetchCatalogServices(providerType: ProviderType): Promise<Service[]> {
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("is_active", true)
    .contains("applies_to", [providerType])
    .order("name", { ascending: true });

  if (error) throw error;
  return (data ?? []) as Service[];
}

export interface MyProviderService {
  service_id: string;
  name: string;
  description: string | null;
  default_price: number | null;
  price: number | null; // السعر المخصّص لمقدّم الخدمة (لو null يُستخدم default_price)
}

/**
 * الجدولان doctor_services وnurse_services بنفس الشكل بالضبط، لكن أسماء
 * الأعمدة مختلفة (doctor_id / nurse_id) — بنفرّع صراحة بدل استخدام اسم
 * عمود ديناميكي، عشان أنواع TypeScript الخاصة بـ Insert/Update تتحقق صح.
 */

export async function fetchMyProviderServices(
  providerId: string,
  providerType: ProviderType
): Promise<MyProviderService[]> {
  const { data, error } =
    providerType === "doctor"
      ? await supabase
          .from("doctor_services")
          .select(`service_id, price, services(name, description, default_price)`)
          .eq("doctor_id", providerId)
      : await supabase
          .from("nurse_services")
          .select(`service_id, price, services(name, description, default_price)`)
          .eq("nurse_id", providerId);

  if (error) throw error;

  return (data ?? []).map((row) => {
    const service = row.services as unknown as {
      name: string;
      description: string | null;
      default_price: number | null;
    };
    return {
      service_id: row.service_id,
      price: row.price,
      name: service?.name ?? "",
      description: service?.description ?? null,
      default_price: service?.default_price ?? null,
    };
  });
}

export async function addMyProviderService(
  providerId: string,
  providerType: ProviderType,
  serviceId: string,
  price: number | null
) {
  const { error } =
    providerType === "doctor"
      ? await supabase.from("doctor_services").insert({ doctor_id: providerId, service_id: serviceId, price })
      : await supabase.from("nurse_services").insert({ nurse_id: providerId, service_id: serviceId, price });

  if (error) throw error;
}

export async function updateMyProviderServicePrice(
  providerId: string,
  providerType: ProviderType,
  serviceId: string,
  price: number | null
) {
  const { error } =
    providerType === "doctor"
      ? await supabase
          .from("doctor_services")
          .update({ price })
          .eq("doctor_id", providerId)
          .eq("service_id", serviceId)
      : await supabase
          .from("nurse_services")
          .update({ price })
          .eq("nurse_id", providerId)
          .eq("service_id", serviceId);

  if (error) throw error;
}

export async function removeMyProviderService(
  providerId: string,
  providerType: ProviderType,
  serviceId: string
) {
  const { error } =
    providerType === "doctor"
      ? await supabase.from("doctor_services").delete().eq("doctor_id", providerId).eq("service_id", serviceId)
      : await supabase.from("nurse_services").delete().eq("nurse_id", providerId).eq("service_id", serviceId);

  if (error) throw error;
}
