import * as React from "react";
import type { SymptomSummary } from "@/types/aiAssistant";
import { Button } from "@/components/ui/button";

/** ملخص الحالة قبل التوصية: المريض يؤكده أو يصححه (التصحيح يُرسل كرسالة للمساعد). */
export function SymptomSummaryCard({
  summary,
  disabled,
  onConfirm,
  onCorrect,
}: {
  summary: SymptomSummary;
  disabled?: boolean;
  onConfirm: () => void;
  onCorrect: (correction: string) => void;
}) {
  const [editing, setEditing] = React.useState(false);
  const [text, setText] = React.useState("");

  return (
    <section aria-label="ملخص الحالة" className="rounded-[var(--radius-lg)] border border-[var(--color-primary)]/30 bg-[var(--color-primary-light)]/40 p-4 sm:p-5">
      <h2 className="font-medium text-[var(--color-ink)]">هل هذا الملخص صحيح؟</h2>
      <dl className="mt-3 space-y-1.5 text-sm">
        <div className="flex gap-2"><dt className="shrink-0 text-[var(--color-ink-muted)]">الأعراض:</dt><dd>{summary.symptoms?.length ? summary.symptoms.join("، ") : "—"}</dd></div>
        <div className="flex gap-2"><dt className="shrink-0 text-[var(--color-ink-muted)]">المدة:</dt><dd>{summary.duration ?? "—"}</dd></div>
        <div className="flex gap-2"><dt className="shrink-0 text-[var(--color-ink-muted)]">الشدة:</dt><dd>{summary.severity ?? "—"}</dd></div>
        {summary.context && <div className="flex gap-2"><dt className="shrink-0 text-[var(--color-ink-muted)]">ملاحظات:</dt><dd>{summary.context}</dd></div>}
      </dl>

      {editing ? (
        <div className="mt-4 space-y-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            dir="auto"
            rows={2}
            aria-label="التصحيح"
            placeholder="اكتب ما تريد تصحيحه أو إضافته"
            className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white p-3 text-sm"
          />
          <div className="flex gap-2">
            <Button size="sm" disabled={disabled || !text.trim()} onClick={() => { onCorrect(text.trim()); setText(""); setEditing(false); }}>
              إرسال التصحيح
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>إلغاء</Button>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" disabled={disabled} onClick={onConfirm}>نعم، اقترح التخصصات المناسبة</Button>
          <Button size="sm" variant="outline" disabled={disabled} onClick={() => setEditing(true)}>تعديل</Button>
        </div>
      )}
    </section>
  );
}
