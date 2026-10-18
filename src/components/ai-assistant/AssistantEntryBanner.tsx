import { Link } from "react-router-dom";
import { ArrowLeft, MessageCircleHeart, ShieldCheck } from "lucide-react";

/** نقطة دخول للمساعد الصحي الذكي — تُستخدم في الرئيسية وصفحة الأطباء. */
export function AssistantEntryBanner() {
  return (
    <Link
      to="/ai-assistant"
      className="group relative isolate flex min-w-0 flex-col overflow-hidden rounded-2xl border border-primary/15 bg-[#FAF9F6] p-4 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-elevated sm:flex-row sm:items-center sm:gap-5 sm:p-5"
    >
      <span className="pointer-events-none absolute -left-16 -top-16 h-40 w-40 rounded-full bg-[#DDECE8] opacity-80 transition-transform duration-500 group-hover:scale-110" />
      <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#164E52] text-white shadow-soft sm:h-14 sm:w-14">
        <MessageCircleHeart className="h-6 w-6" aria-hidden />
      </span>
      <span className="relative mt-4 min-w-0 flex-1 sm:mt-0">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-[#164E52]/75"><ShieldCheck className="h-3.5 w-3.5" />توجيه صحي أولي</span>
        <span className="mt-1 block text-lg font-semibold leading-snug text-[#164E52]">مش عارف تروح لدكتور تخصص إيه؟</span>
        <span className="mt-1.5 block max-w-2xl text-sm leading-6 text-muted-foreground">احكي عن أعراضك وخلي المساعد الطبي يساعدك تعرف التخصص المناسب.</span>
      </span>
      <span className="relative mt-4 inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-[#164E52] px-4 text-sm font-semibold text-white transition-colors group-hover:bg-[#123f43] sm:mt-0 sm:w-auto">
        ابدأ محادثة مع المساعد الطبي <ArrowLeft className="h-4 w-4" aria-hidden />
      </span>
    </Link>
  );
}
