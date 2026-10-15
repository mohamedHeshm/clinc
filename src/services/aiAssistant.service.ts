import { supabase } from "@/lib/supabase";
import type {
  AssistantResponse,
  ConfidenceLabel,
  RecommendedSpecialty,
} from "@/types/aiAssistant";
import { fetchDoctorSpecializations } from "@/features/doctors/services/doctors.service";
import { fetchProviderAvailability } from "@/features/availability/services/availability.service";
import { fetchAvailableSlots } from "@/features/availability/services/slots.service";
import { matchSpecialty } from "@/utils/specialtyMatch";

export { matchSpecialty };

export type AssistantErrorCode =
  | "UNAUTHENTICATED"
  | "RATE_LIMITED"
  | "UNAVAILABLE"
  | "UNKNOWN";

export class AssistantError extends Error {
  readonly code: AssistantErrorCode;

  constructor(code: AssistantErrorCode, message: string) {
    super(message);
    this.name = "AssistantError";
    this.code = code;
  }
}

export interface DoctorRecommendation {
  doctor: DoctorDirectoryEntry;
  specialtyName: string;
  confidence: ConfidenceLabel;
  reason: string;
  nextSlots: {
    date: string;
    slots: AvailableSlot[];
  } | null;
}

interface AvailableSlot {
  slot_start: string;
  slot_end: string;
  is_available: boolean;
}

interface DoctorDirectoryEntry {
  doctor_id: string;
  full_name: string;
  avatar_url: string | null;
  specialization_name: string | null;
  experience_years: number;
  reviews_count: number;
  average_rating: number;
  consultation_price: number;
  clinic_address: string | null;
}

export interface RecommendationResult {
  matched: DoctorRecommendation[];
  unmatchedSpecialties: string[];
}

const CONFIDENCE_ORDER: Record<ConfidenceLabel, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

/**
 * إرسال رسالة للمساعد من خلال Supabase Edge Function.
 * مفتاح الذكاء الاصطناعي لا يُستخدم في الواجهة الأمامية.
 */
export async function sendAssistantMessage(params: {
  sessionId: string | null;
  message: string;
}): Promise<AssistantResponse> {
  const message = params.message.trim();

  if (!message) {
    throw new AssistantError(
      "UNKNOWN",
      "برجاء كتابة الأعراض أو السؤال أولًا."
    );
  }

  const { data, error } = await supabase.functions.invoke(
    "ai-health-assistant",
    {
      body: {
        sessionId: params.sessionId,
        message,
      },
    }
  );

  if (error) {
    const status = (
      error as { context?: { status?: number } }
    ).context?.status;

    if (status === 401) {
      throw new AssistantError(
        "UNAUTHENTICATED",
        "برجاء تسجيل الدخول لاستخدام المساعد الصحي."
      );
    }

    if (status === 429) {
      throw new AssistantError(
        "RATE_LIMITED",
        "استخدمت المساعد عدة مرات مؤخرًا، حاول لاحقًا."
      );
    }

    throw new AssistantError(
      "UNAVAILABLE",
      "المساعد الذكي غير متاح الآن. يمكنك البحث عن طبيب يدويًا."
    );
  }

  if (!data || typeof data !== "object") {
    throw new AssistantError(
      "UNAVAILABLE",
      "لم تصل استجابة صحيحة من المساعد الصحي."
    );
  }

  if ("error" in data && data.error) {
    throw new AssistantError("UNKNOWN", String(data.error));
  }

  return data as AssistantResponse;
}

function isoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/**
 * جلب أقرب مواعيد فعلية خلال الأيام السبعة القادمة.
 * تعذّر جلب المواعيد لا يمنع عرض الطبيب.
 */
async function findNextSlots(
  doctorId: string
): Promise<{ date: string; slots: AvailableSlot[] } | null> {
  try {
    const workingDays = await fetchProviderAvailability(doctorId, "doctor");

    const workingDaySet = new Set(
      workingDays.map((workingDay) => workingDay.day_of_week)
    );

    if (workingDaySet.size === 0) {
      return null;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let offset = 0; offset < 7; offset++) {
      const date = new Date(today);
      date.setDate(today.getDate() + offset);

      const day = date.getDay();

      if (!workingDaySet.has(day)) {
        continue;
      }

      const slots = await fetchAvailableSlots(
        doctorId,
        "doctor",
        isoDate(date)
      );

      const availableSlots = slots
        .filter((slot) => slot.is_available)
        .slice(0, 4);

      if (availableSlots.length > 0) {
        return {
          date: isoDate(date),
          slots: availableSlots,
        };
      }
    }

    return null;
  } catch {
    // نستمر في عرض الطبيب حتى لو تعذر جلب المواعيد.
    return null;
  }
}

/**
 * يجلب الأطباء النشطين للتخصصات التي طابقت قاعدة البيانات.
 * ترتيب النتائج:
 * 1. وجود مواعيد متاحة.
 * 2. قوة تطابق التخصص.
 * 3. التقييم.
 * 4. السعر الأقل.
 */
export async function findDoctorsForSpecialties(
  specialties: RecommendedSpecialty[]
): Promise<RecommendationResult> {
  const availableSpecializations = (await fetchDoctorSpecializations()).map((name) => ({
    id: name,
    name,
  }));

  const unmatchedSpecialties: string[] = [];
  const picks: {
    spec: { id: string; name: string };
    rec: RecommendedSpecialty;
  }[] = [];

  for (const recommendation of specialties) {
    const specialization = matchSpecialty(
      recommendation.name,
      availableSpecializations
    );

    if (specialization) {
      picks.push({
        spec: specialization,
        rec: recommendation,
      });
    } else {
      unmatchedSpecialties.push(recommendation.name);
    }
  }

  if (picks.length === 0) {
    return {
      matched: [],
      unmatchedSpecialties,
    };
  }

  const results: DoctorRecommendation[] = [];
  const seenDoctorIds = new Set<string>();

  for (const { spec, rec } of picks) {
    const { data, error } = await supabase
      .from("doctors_public")
      .select("*")
      .eq("specialization", spec.name)
      .order("rating_avg", {
        ascending: false,
        nullsFirst: false,
      })
      .limit(4);

    if (error) {
      throw error;
    }

    const doctors = ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
      doctor_id: String(row.id ?? ""),
      full_name: String(row.full_name ?? ""),
      avatar_url: typeof row.avatar_url === "string" ? row.avatar_url : null,
      specialization_name: typeof row.specialization === "string" ? row.specialization : null,
      experience_years: Number(row.experience_years ?? 0),
      reviews_count: Number(row.rating_count ?? 0),
      average_rating: Number(row.rating_avg ?? 0),
      consultation_price: Number(row.consultation_price ?? 0),
      clinic_address: typeof row.clinic_address === "string" ? row.clinic_address : null,
    })) as DoctorDirectoryEntry[];

    const newDoctors = doctors.filter((doctor) => {
      if (seenDoctorIds.has(doctor.doctor_id)) {
        return false;
      }

      seenDoctorIds.add(doctor.doctor_id);
      return true;
    });

    const recommendations = await Promise.all(
      newDoctors.map(async (doctor): Promise<DoctorRecommendation> => ({
        doctor,
        specialtyName: spec.name,
        confidence: rec.confidence_label,
        reason: rec.reason,
        nextSlots: await findNextSlots(doctor.doctor_id),
      }))
    );

    results.push(...recommendations);
  }

  results.sort((a, b) => {
    const availabilityDifference =
      Number(Boolean(b.nextSlots)) -
      Number(Boolean(a.nextSlots));

    if (availabilityDifference !== 0) {
      return availabilityDifference;
    }

    const confidenceDifference =
      CONFIDENCE_ORDER[b.confidence] -
      CONFIDENCE_ORDER[a.confidence];

    if (confidenceDifference !== 0) {
      return confidenceDifference;
    }

    const ratingA = Number(a.doctor.average_rating ?? 0);
    const ratingB = Number(b.doctor.average_rating ?? 0);
    const ratingDifference = ratingB - ratingA;

    if (ratingDifference !== 0) {
      return ratingDifference;
    }

    const priceA = Number(a.doctor.consultation_price ?? Infinity);
    const priceB = Number(b.doctor.consultation_price ?? Infinity);

    return priceA - priceB;
  });

  return {
    matched: results,
    unmatchedSpecialties,
  };
}
