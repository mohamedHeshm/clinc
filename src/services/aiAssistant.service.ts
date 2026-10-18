
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

function getInvokeStatus(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null) {
    return undefined;
  }

  const context = (error as {
    context?: { status?: unknown };
  }).context;

  return typeof context?.status === "number"
    ? context.status
    : undefined;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

/**
 * إرسال رسالة للمساعد عبر Supabase Edge Function.
 * لا يتم وضع مفتاح Gemini في الواجهة الأمامية.
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

  let data: unknown;
  let invokeError: unknown;

  try {
    const result = await supabase.functions.invoke(
      "ai-health-assistant",
      {
        body: {
          sessionId: params.sessionId,
          message,
        },
      }
    );

    data = result.data;
    invokeError = result.error;
  } catch (error) {
    console.error("[AI_ASSISTANT_INVOKE_ERROR]", {
      message:
        error instanceof Error
          ? error.message
          : "Unknown invocation error",
    });

    throw new AssistantError(
      "UNAVAILABLE",
      "تعذّر الاتصال بالمساعد الصحي. حاول مرة أخرى أو تصفّح الأطباء."
    );
  }

  if (invokeError) {
    const status = getInvokeStatus(invokeError);

    console.error("[AI_ASSISTANT_INVOKE_ERROR]", {
      status: status ?? null,
      message:
        invokeError instanceof Error
          ? invokeError.message
          : "Function invocation failed",
    });

    if (status === 401) {
      throw new AssistantError(
        "UNAUTHENTICATED",
        "برجاء تسجيل الدخول من جديد لاستخدام المساعد الصحي."
      );
    }

    if (status === 429) {
      throw new AssistantError(
        "RATE_LIMITED",
        "استخدمت المساعد عدة مرات مؤخرًا. حاول لاحقًا."
      );
    }

    throw new AssistantError(
      "UNAVAILABLE",
      "المساعد الصحي غير متاح حاليًا. يمكنك تصفّح الأطباء مباشرة."
    );
  }

  if (!isObject(data)) {
    throw new AssistantError(
      "UNAVAILABLE",
      "لم تصل استجابة صحيحة من المساعد الصحي."
    );
  }

  if (typeof data.error === "string" && data.error) {
    throw new AssistantError("UNKNOWN", data.error);
  }

  // أخطاء Gemini قد ترجع HTTP 200 مع ai_error.
  // نمرر الاستجابة للواجهة حتى تتمكن من عرض fallback.
  if (typeof data.ai_error === "string" && data.ai_error) {
    console.warn("[AI_ASSISTANT_PROVIDER_ERROR]", {
      code: data.ai_error,
    });
  }

  const validResponse =
    typeof data.sessionId === "string" &&
    typeof data.stage === "string" &&
    typeof data.is_emergency === "boolean" &&
    Array.isArray(data.follow_up_questions) &&
    Array.isArray(data.emergency_reasons) &&
    Array.isArray(data.recommended_specialties);

  if (!validResponse) {
    console.error("[AI_ASSISTANT_INVALID_RESPONSE]", {
      fields: Object.keys(data),
    });

    throw new AssistantError(
      "UNAVAILABLE",
      "استجابة المساعد غير مكتملة. حاول مرة أخرى لاحقًا."
    );
  }

  return data as unknown as AssistantResponse;
}

function isoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/**
 * جلب أقرب مواعيد متاحة خلال الأيام السبعة القادمة.
 * فشل جلب المواعيد لا يمنع عرض الطبيب.
 */
async function findNextSlots(
  doctorId: string
): Promise<{ date: string; slots: AvailableSlot[] } | null> {
  try {
    const workingDays = await fetchProviderAvailability(
      doctorId,
      "doctor"
    );

    const workingDaySet = new Set(
      workingDays.map((day) => day.day_of_week)
    );

    if (workingDaySet.size === 0) {
      return null;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let offset = 0; offset < 7; offset++) {
      const date = new Date(today);
      date.setDate(today.getDate() + offset);

      if (!workingDaySet.has(date.getDay())) {
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
  } catch (error) {
    console.warn("[AI_ASSISTANT_SLOTS_ERROR]", {
      message:
        error instanceof Error
          ? error.message
          : "Unknown slots error",
    });

    return null;
  }
}

/**
 * جلب الأطباء حسب التخصصات المقترحة.
 */
export async function findDoctorsForSpecialties(
  specialties: RecommendedSpecialty[]
): Promise<RecommendationResult> {
  if (specialties.length === 0) {
    return {
      matched: [],
      unmatchedSpecialties: [],
    };
  }

  const names = await fetchDoctorSpecializations();

  const availableSpecializations = names.map((name) => ({
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

    if (!specialization) {
      unmatchedSpecialties.push(recommendation.name);
      continue;
    }

    picks.push({
      spec: specialization,
      rec: recommendation,
    });
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
      console.error("[AI_ASSISTANT_DOCTOR_QUERY_ERROR]", {
        code: error.code,
        message: error.message,
      });

      throw new Error(
        "تعذّر تحميل الأطباء من قاعدة البيانات."
      );
    }

    const doctors: DoctorDirectoryEntry[] = (
      (data ?? []) as Array<Record<string, unknown>>
    )
      .map((row) => ({
        doctor_id: String(row.id ?? ""),
        full_name: String(row.full_name ?? ""),
        avatar_url:
          typeof row.avatar_url === "string"
            ? row.avatar_url
            : null,
        specialization_name:
          typeof row.specialization === "string"
            ? row.specialization
            : null,
        experience_years: Number(row.experience_years ?? 0),
        reviews_count: Number(row.rating_count ?? 0),
        average_rating: Number(row.rating_avg ?? 0),
        consultation_price: Number(row.consultation_price ?? 0),
        clinic_address:
          typeof row.clinic_address === "string"
            ? row.clinic_address
            : null,
      }))
      .filter(
        (doctor) => doctor.doctor_id && doctor.full_name
      );

    const newDoctors = doctors.filter((doctor) => {
      if (seenDoctorIds.has(doctor.doctor_id)) {
        return false;
      }

      seenDoctorIds.add(doctor.doctor_id);
      return true;
    });

    const recommendations = await Promise.all(
      newDoctors.map(
        async (doctor): Promise<DoctorRecommendation> => ({
          doctor,
          specialtyName: spec.name,
          confidence: rec.confidence_label,
          reason: rec.reason,
          nextSlots: await findNextSlots(doctor.doctor_id),
        })
      )
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

    const ratingDifference =
      b.doctor.average_rating - a.doctor.average_rating;

    if (ratingDifference !== 0) {
      return ratingDifference;
    }

    return (
      a.doctor.consultation_price -
      b.doctor.consultation_price
    );
  });

  return {
    matched: results,
    unmatchedSpecialties,
  };
}
