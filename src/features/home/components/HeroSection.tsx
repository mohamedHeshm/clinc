import { Link } from "react-router-dom";
import { CalendarCheck, HeartPulse, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";

export function HeroSection() {
  return (
    <section className="overflow-hidden border-b border-border bg-surface/70">
      <div className="container grid items-center gap-10 py-12 md:grid-cols-2 md:py-20">
        <div className="text-center md:text-right">
          <span className="inline-flex rounded-full bg-accent-subtle px-3 py-1 text-xs font-semibold text-accent">
            رعاية موثوقة تبدأ بخطوة بسيطة
          </span>
          <h1 className="mt-4 text-3xl font-semibold leading-[1.25] text-foreground sm:text-4xl md:text-5xl">
            صحتك تستحق رعاية أقرب وأكثر اهتمامًا
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            ابحث عن الطبيب أو الممرض المناسب، واحجز موعدك بسهولة أو اطلب الرعاية المنزلية في
            المكان الذي تختاره.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row md:justify-start">
            <Button size="lg" asChild>
              <Link to={ROUTES.doctors}>احجز مع طبيب</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to={ROUTES.nurses}>اطلب تمريض منزلي</Link>
            </Button>
          </div>
          <div className="mt-8 grid grid-cols-3 gap-2 text-right">
            <div className="rounded-lg bg-surface-muted/80 p-3"><CalendarCheck className="h-4 w-4 text-primary" /><p className="mt-2 text-xs font-medium">حجز سريع</p></div>
            <div className="rounded-lg bg-surface-muted/80 p-3"><ShieldCheck className="h-4 w-4 text-accent" /><p className="mt-2 text-xs font-medium">بيانات آمنة</p></div>
            <div className="rounded-lg bg-surface-muted/80 p-3"><HeartPulse className="h-4 w-4 text-destructive" /><p className="mt-2 text-xs font-medium">رعاية إنسانية</p></div>
          </div>
        </div>

        <div className="relative mx-auto aspect-[4/3] w-full max-w-md">
          <div className="absolute -inset-4 -rotate-3 rounded-[2rem] bg-primary-subtle" />
          <div className="relative h-full overflow-hidden rounded-[1.5rem] bg-surface shadow-elevated">
          {/* صورة placeholder من Unsplash (رخصة استخدام حر) — استبدلها بصورة مملوكة
              للمنصة أو مرخّصة فعليًا قبل الإطلاق النهائي على production. */}
          <img
            src="https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?q=80&w=1200&auto=format&fit=crop"
            alt="طبيبة تستشير مريضًا"
            className="h-full w-full object-cover"
            loading="eager"
          />
          <div className="absolute bottom-4 right-4 rounded-lg bg-surface/95 px-4 py-3 shadow-soft backdrop-blur">
            <p className="text-xs text-muted-foreground">مواعيد تناسب يومك</p>
            <p className="mt-0.5 text-sm font-semibold text-foreground">اختر الطبيب والوقت بسهولة</p>
          </div>
          </div>
        </div>
      </div>
    </section>
  );
}
