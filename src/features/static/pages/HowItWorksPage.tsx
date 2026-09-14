import { Search, CalendarCheck, Stethoscope, Star } from "lucide-react";

const STEPS = [
  {
    icon: Search,
    title: "ابحث عن مقدّم الرعاية المناسب",
    description: "تصفّح الأطباء حسب التخصص، أو الممرضين حسب نوع الخدمة والمنطقة، وشاهد التقييمات والأسعار.",
  },
  {
    icon: CalendarCheck,
    title: "احجز موعدك",
    description: "اختر التاريخ والوقت المناسبين لك — للعيادة أو للزيارة المنزلية مع تحديد الموقع على الخريطة.",
  },
  {
    icon: Stethoscope,
    title: "احصل على الرعاية",
    description: "بعد موافقة الطبيب أو الممرض، تصلك إشعارات بحالة حجزك أولًا بأول حتى موعد الزيارة.",
  },
  {
    icon: Star,
    title: "قيّم تجربتك",
    description: "بعد اكتمال الخدمة، شارك تقييمك ليستفيد منه مستخدمون آخرون يبحثون عن نفس الرعاية.",
  },
];

export function HowItWorksPage() {
  return (
    <div className="container max-w-3xl py-14">
      <h1 className="text-center text-2xl font-semibold text-foreground">كيف تعمل المنصة</h1>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        أربع خطوات بسيطة تفصلك عن الرعاية الصحية التي تحتاجها
      </p>

      <div className="mt-12 space-y-8">
        {STEPS.map((step, index) => (
          <div key={step.title} className="flex gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-primary">
              <step.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">خطوة {index + 1}</p>
              <h2 className="mt-0.5 font-semibold text-foreground">{step.title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
