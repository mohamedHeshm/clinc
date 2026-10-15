import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";

/** نقطة دخول للمساعد الصحي الذكي — تُستخدم في الرئيسية وصفحة الأطباء. */
export function AssistantEntryBanner() {
  return (
    <Link
      to="/ai-assistant"
      className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--color-primary)]/25 bg-[var(--color-primary-light)]/50 px-4 py-3.5 transition-colors hover:border-[var(--color-primary)]/50"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-white">
        <Sparkles className="h-5 w-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium text-[var(--color-ink)]">لست متأكدًا أي طبيب تحتاج؟</span>
        <span className="block text-sm text-[var(--color-ink-muted)]">جرّب المساعد الصحي الذكي — صِف أعراضك وسنقترح التخصص المناسب.</span>
      </span>
      <span className="shrink-0 text-sm font-medium text-[var(--color-primary)]">ابدأ</span>
    </Link>
  );
}
