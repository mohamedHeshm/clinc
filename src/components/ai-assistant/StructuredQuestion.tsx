import * as React from "react";
import type { StructuredQuestion as Q } from "@/types/aiAssistant";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DEFAULT_DURATIONS = ["أقل من يوم", "من 1 إلى 3 أيام", "حوالي أسبوع", "أكثر من أسبوع", "أكثر من شهر"];

function Chip({ active, onClick, children }: { active?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "min-h-11 rounded-[var(--radius-md)] border px-4 py-2 text-sm transition-colors",
        active
          ? "border-[var(--color-primary)] bg-[var(--color-primary-light)] font-medium text-[var(--color-primary-dark)]"
          : "border-[var(--color-border)] bg-white text-[var(--color-ink)] hover:border-[var(--color-border-strong)]"
      )}
    >
      {children}
    </button>
  );
}

/** يعرض سؤالًا مُهيكلًا واحدًا. الإجابة تُرسل كنص للمساعد (نفس مسار المحادثة). */
export function StructuredQuestion({
  question,
  disabled,
  onAnswer,
}: {
  question: Q;
  disabled?: boolean;
  onAnswer: (answerText: string) => void;
}) {
  const [multi, setMulti] = React.useState<string[]>([]);
  const [text, setText] = React.useState("");
  const [scale, setScale] = React.useState<number | null>(null);

  const send = (answer: string) => onAnswer(`${question.prompt}: ${answer}`);

  return (
    <fieldset disabled={disabled} className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4">
      <legend className="px-1 text-sm font-medium text-[var(--color-ink)]">{question.prompt}</legend>

      {question.type === "single_choice" && (
        <div className="mt-2 flex flex-wrap gap-2">
          {(question.options ?? []).map((o) => (
            <Chip key={o} onClick={() => send(o)}>{o}</Chip>
          ))}
        </div>
      )}

      {question.type === "yes_no" && (
        <div className="mt-2 flex gap-2">
          <Chip onClick={() => send("نعم")}>نعم</Chip>
          <Chip onClick={() => send("لا")}>لا</Chip>
          <Chip onClick={() => send("لست متأكدًا")}>لست متأكدًا</Chip>
        </div>
      )}

      {question.type === "duration" && (
        <div className="mt-2 flex flex-wrap gap-2">
          {(question.options?.length ? question.options : DEFAULT_DURATIONS).map((o) => (
            <Chip key={o} onClick={() => send(o)}>{o}</Chip>
          ))}
        </div>
      )}

      {question.type === "multi_choice" && (
        <>
          <div className="mt-2 flex flex-wrap gap-2">
            {(question.options ?? []).map((o) => (
              <Chip
                key={o}
                active={multi.includes(o)}
                onClick={() => setMulti((m) => (m.includes(o) ? m.filter((x) => x !== o) : [...m, o]))}
              >
                {o}
              </Chip>
            ))}
          </div>
          <Button type="button" size="sm" className="mt-3" disabled={multi.length === 0} onClick={() => send(multi.join("، "))}>
            تأكيد الاختيار
          </Button>
        </>
      )}

      {question.type === "severity_scale" && (
        <>
          <div className="mt-2 grid grid-cols-5 gap-2 sm:grid-cols-10" dir="ltr">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <Chip key={n} active={scale === n} onClick={() => setScale(n)}>{n}</Chip>
            ))}
          </div>
          <p className="mt-1 flex justify-between text-xs text-[var(--color-ink-faint)]">
            <span>1 = خفيف جدًا</span>
            <span>10 = شديد جدًا</span>
          </p>
          <Button type="button" size="sm" className="mt-3" disabled={scale === null} onClick={() => send(`${scale} من 10`)}>
            تأكيد
          </Button>
        </>
      )}

      {question.type === "free_text" && (
        <div className="mt-2 flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            dir="auto"
            aria-label={question.prompt}
            className="h-11 min-w-0 flex-1 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-sm"
          />
          <Button type="button" size="sm" disabled={!text.trim()} onClick={() => send(text.trim())}>
            إرسال
          </Button>
        </div>
      )}
    </fieldset>
  );
}
