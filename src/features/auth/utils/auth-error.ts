/**
 * Supabase بترجّع أخطاء بالإنجليزية دايمًا — بنترجم الحالات الشائعة هنا
 * لرسائل عربية مفهومة، وبنرجع رسالة عامة آمنة لأي حالة مش متوقعة
 * (بدون كشف تفاصيل تقنية حساسة للمستخدم — قسم 55).
 */
export function getAuthErrorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  const msg = raw.toLowerCase();

  if (msg.includes("invalid login credentials")) {
    return "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
  }
  if (msg.includes("user already registered") || msg.includes("already registered")) {
    return "هذا البريد الإلكتروني مسجَّل بالفعل. جرّب تسجيل الدخول بدلًا من ذلك.";
  }
  if (msg.includes("password should be at least")) {
    return "كلمة المرور قصيرة جدًا — يجب أن تكون 8 أحرف على الأقل.";
  }
  if (msg.includes("email not confirmed")) {
    return "لم يتم تأكيد البريد الإلكتروني بعد. تحقق من صندوق الوارد.";
  }
  if (msg.includes("rate limit") || msg.includes("too many requests")) {
    return "محاولات كثيرة جدًا في وقت قصير. برجاء الانتظار قليلًا والمحاولة مرة أخرى.";
  }
  if (msg.includes("network") || msg.includes("fetch")) {
    return "تعذّر الاتصال بالخادم. تحقق من اتصالك بالإنترنت.";
  }

  return "حدث خطأ غير متوقع. برجاء المحاولة مرة أخرى.";
}
