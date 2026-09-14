import { supabase } from "@/lib/supabase";
import type { Review } from "@/types/models";

export interface ReviewWithAuthor extends Review {
  author_name: string;
}

/**
 * ملاحظة: جدول reviews لا يحتوي على اسم المُقيِّم مباشرة (user_id فقط)،
 * وجدول profiles محمي بـ RLS (كل مستخدم يرى صفّه فقط) — فمينفعش نعمل join
 * عادي من هنا. لعرض اسم المُقيِّم بأمان في صفحات عامة، نجيب أول اسم أول
 * حرف بس (privacy-safe) عبر دالة قاعدة بيانات مخصّصة لاحقًا لو احتجنا
 * تفاصيل أكتر. حاليًا نعرض التقييمات بدون اسم المُقيِّم (Rating + Comment فقط)
 * وهو المتاح فعليًا وآمن من الجدول العام.
 */
export async function fetchProviderReviews(
  providerId: string,
  providerType: "doctor" | "nurse",
  limit = 20
): Promise<Review[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("provider_id", providerId)
    .eq("provider_type", providerType)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as Review[];
}

export async function fetchReviewByBookingId(bookingId: string): Promise<Review | null> {
  const { data, error } = await supabase.from("reviews").select("*").eq("booking_id", bookingId).maybeSingle();
  if (error) throw error;
  return data as Review | null;
}

export interface CreateReviewInput {
  bookingId: string;
  userId: string;
  providerId: string;
  providerType: "doctor" | "nurse";
  rating: number;
  comment?: string;
}

export async function createReview(input: CreateReviewInput) {
  const { error } = await supabase.from("reviews").insert({
    booking_id: input.bookingId,
    user_id: input.userId,
    provider_id: input.providerId,
    provider_type: input.providerType,
    rating: input.rating,
    comment: input.comment ?? null,
  });
  if (error) throw error;
}
