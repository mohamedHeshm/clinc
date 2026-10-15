export interface NamedSpecialty {
  id: string;
  name: string;
}

export function normalizeArabic(s: string): string {
  return s
    .toLowerCase()
    .replace(/[\u064B-\u0652\u0640]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/\s+/g, " ")
    .trim();
}

/** يطابق اسم تخصص مقترح مع تخصصات قاعدة البيانات الفعلية فقط؛ null إن لم يوجد. */
export function matchSpecialty<T extends NamedSpecialty>(name: string, available: T[]): T | null {
  const n = normalizeArabic(name);
  if (!n) return null;
  const exact = available.find((s) => normalizeArabic(s.name) === n);
  if (exact) return exact;
  return (
    available.find((s) => {
      const sn = normalizeArabic(s.name);
      return sn.includes(n) || n.includes(sn);
    }) ?? null
  );
}