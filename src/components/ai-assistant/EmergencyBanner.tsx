import { AlertTriangle, HeartHandshake } from "lucide-react";

export function EmergencyBanner({ reasons, selfHarm }: { reasons: string[]; selfHarm: boolean }) {
  return (
    <div
      role="alert"
      className="rounded-[var(--radius-lg)] border border-[var(--color-danger)]/30 bg-[var(--color-danger-light)] p-4 sm:p-5"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-danger)]" aria-hidden />
        <div className="text-sm leading-7 text-[var(--color-ink)]">
          <p className="font-semibold text-[var(--color-danger)]">
            ما وصفته قد يحتاج رعاية طبية عاجلة
          </p>
          <p className="mt-1">
            برجاء التوجّه لأقرب طوارئ أو الاتصال بخدمة الإسعاف (الرقم 123 في مصر) الآن، ولا تنتظر موعدًا عاديًا.
            إن أمكن، اطلب من شخص قريب أن يكون معك.
          </p>
          {reasons.length > 0 && (
            <ul className="mt-2 list-disc space-y-0.5 pr-5 text-[var(--color-ink-muted)]">
              {reasons.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          )}
          {selfHarm && (
            <div className="mt-3 flex items-start gap-2 rounded-[var(--radius-md)] bg-white/70 p-3">
              <HeartHandshake className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-primary)]" aria-hidden />
              <p>
                لست وحدك. من فضلك تواصل الآن مع شخص تثق به أو مع خدمة دعم نفسي أو طوارئ في بلدك — حديثك مع
                شخص حقيقي الآن مهم جدًا.
              </p>
            </div>
          )}
          <p className="mt-3 text-xs text-[var(--color-ink-faint)]">
            هذا تنبيه آلي مبني على ما كتبته، وليس تشخيصًا. إذا كنت تشعر أنك بخير فاستشر طبيبًا على أي حال.
          </p>
        </div>
      </div>
    </div>
  );
}
