import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";

export function HeroSection() {
  return (
    <section className="border-b border-border bg-surface">
      <div className="container grid items-center gap-10 py-14 md:grid-cols-2 md:py-20">
        <div className="text-center md:text-right">
          <h1 className="text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
            رعايتك الصحية أصبحت أقرب إليك
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
        </div>

        <div className="mx-auto aspect-[4/3] w-full max-w-md overflow-hidden rounded-lg bg-surface-muted">
          {/* صورة placeholder من Unsplash (رخصة استخدام حر) — استبدلها بصورة مملوكة
              للمنصة أو مرخّصة فعليًا قبل الإطلاق النهائي على production. */}
          <img
            src="https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?q=80&w=1200&auto=format&fit=crop"
            alt="طبيبة تستشير مريضًا"
            className="h-full w-full object-cover"
            loading="eager"
          />
        </div>
      </div>
    </section>
  );
}
