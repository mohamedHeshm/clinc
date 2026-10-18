import * as React from "react";
import { Link } from "react-router-dom";
import { Send, RotateCcw, ShieldAlert, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { EmergencyBanner } from "@/components/ai-assistant/EmergencyBanner";
import { StructuredQuestion } from "@/components/ai-assistant/StructuredQuestion";
import { SymptomSummaryCard } from "@/components/ai-assistant/SymptomSummaryCard";
import { DoctorRecommendationCard } from "@/components/ai-assistant/DoctorRecommendationCard";
import {
  AssistantError,
  findDoctorsForSpecialties,
  sendAssistantMessage,
  type RecommendationResult,
} from "@/services/aiAssistant.service";
import type { AssistantResponse, ChatMessage } from "@/types/aiAssistant";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "clinic.ai-assistant.v1";

const GREETING: ChatMessage = {
  id: "greeting",
  role: "assistant",
  content: "أهلًا بك. صِف لي ما تشعر به بكلماتك (مثال: صداع من يومين ومعاه دوخة)، وسأساعدك في معرفة التخصص الطبي الأنسب وأقرب الأطباء المتاحين.",
};

interface Persisted {
  sessionId: string | null;
  messages: ChatMessage[];
}

function loadPersisted(): Persisted {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Persisted;
  } catch {
    /* تجاهل */
  }
  return { sessionId: null, messages: [GREETING] };
}

export default function AIAssistantPage() {
  const { session, isLoading: authLoading } = useAuth();

  const [persisted] = React.useState<Persisted>(loadPersisted);
  const [sessionId, setSessionId] = React.useState<string | null>(persisted.sessionId);
  const [messages, setMessages] = React.useState<ChatMessage[]>(persisted.messages);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [state, setState] = React.useState<AssistantResponse | null>(null);
  const [emergency, setEmergency] = React.useState<{ reasons: string[]; selfHarm: boolean } | null>(null);
  const [error, setError] = React.useState<{ message: string; retryText: string | null } | null>(null);
  const [aiDown, setAiDown] = React.useState(false);
  const [recs, setRecs] = React.useState<RecommendationResult | null>(null);
  const [loadingDoctors, setLoadingDoctors] = React.useState(false);
  const [recsError, setRecsError] = React.useState(false);
  const listRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ sessionId, messages }));
    } catch {
      /* تجاهل */
    }
  }, [sessionId, messages]);

  React.useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, state]);

  const send = React.useCallback(
    async (text: string, opts?: { silent?: boolean }) => {
      const clean = text.trim();
      if (!clean || loading) return;
      setError(null);
      if (!opts?.silent) {
        setMessages((m) => [...m, { id: crypto.randomUUID(), role: "user", content: clean }]);
      }
      setLoading(true);
      try {
        const res = await sendAssistantMessage({ sessionId, message: clean });
        setSessionId(res.sessionId);
        setState(res);
        setAiDown(Boolean(res.ai_error));

        if (res.is_emergency) setEmergency({ reasons: res.emergency_reasons, selfHarm: res.is_self_harm_related });

    if (res.reply_text) {
  setMessages((messages) => [
    ...messages,
    {
      id: crypto.randomUUID(),
      role: "assistant",
      content: res.reply_text!,
    },
  ]);
}
      } catch (e) {
        const msg = e instanceof AssistantError ? e.message : "حدث خطأ غير متوقع، حاول مرة أخرى.";
        setError({ message: msg, retryText: clean });
        if (e instanceof AssistantError && e.code === "UNAVAILABLE") setAiDown(true);
      } finally {
        setLoading(false);
      }
    },
    [loading, sessionId]
  );

  // عند الوصول لمرحلة التوصية وعدم وجود طوارئ: نجلب الأطباء الفعليين من قاعدة البيانات
  React.useEffect(() => {
    if (!state || state.stage !== "recommendations" || state.is_emergency) return;
    if (state.recommended_specialties.length === 0) return;
    let active = true;
    setLoadingDoctors(true);
    setRecsError(false);
    findDoctorsForSpecialties(state.recommended_specialties)
      .then((r) => active && setRecs(r))
      .catch(() => active && setRecsError(true))
      .finally(() => active && setLoadingDoctors(false));
    return () => {
      active = false;
    };
  }, [state]);

  const restart = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    setSessionId(null);
    setMessages([GREETING]);
    setState(null);
    setEmergency(null);
    setRecs(null);
    setError(null);
    setAiDown(false);
    setInput("");
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = input;
    setInput("");
    void send(t);
  };

  if (authLoading) return null;

  const showSummary = state?.stage === "ready_for_summary" && !emergency;
  const showQuestions = !emergency && (state?.follow_up_questions.length ?? 0) > 0 && state?.stage === "collecting";

  return (
    <div className="min-h-[70vh] bg-[var(--color-bg)]">
      <main id="main-content" className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <header className="mb-5">
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-[var(--color-ink)]">
            <Sparkles className="h-5 w-5 text-[var(--color-primary)]" aria-hidden /> المساعد الصحي الذكي
          </h1>
          <p className="mt-1 text-[15px] text-[var(--color-ink-muted)]">AI Health Assistant — يساعدك في اختيار التخصص والطبيب المناسب.</p>
        </header>

        <div className="mb-5 flex items-start gap-2 rounded-[var(--radius-md)] border border-[var(--color-warning)]/30 bg-[var(--color-warning-light)] px-4 py-3 text-sm text-[var(--color-warning)]">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>
            هذا المساعد لا يُشخّص ولا يصف أدوية ولا يغني عن تقييم الطبيب. توصياته للتوجيه فقط وقد لا تكون دقيقة.
            في الحالات الطارئة اتصل بالإسعاف فورًا. تُرسَل رسائلك إلى مزوّد خدمة ذكاء اصطناعي لمعالجتها، ولا نحتفظ بنص المحادثة الكامل.
          </p>
        </div>

        {!session ? (
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-8 text-center">
            <p className="text-[var(--color-ink)]">سجّل دخولك لاستخدام المساعد الصحي الذكي.</p>
            <div className="mt-4 flex justify-center gap-3">
              <Link to="/login" state={{ from: "/ai-assistant" }}><Button>تسجيل الدخول</Button></Link>
              <Link to="/doctors"><Button variant="outline">تصفّح الأطباء</Button></Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
            {/* لوحة المحادثة */}
            <section aria-label="المحادثة" className="flex flex-col rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white">
              <div ref={listRef} className="max-h-[55vh] min-h-[280px] space-y-3 overflow-y-auto p-4" aria-live="polite">
                {messages.map((m) => (
                  <div key={m.id} className={cn("flex", m.role === "user" ? "justify-start" : "justify-end")}>
                    <p
                      dir="auto"
                      className={cn(
                        "max-w-[88%] whitespace-pre-wrap rounded-[var(--radius-lg)] px-4 py-2.5 text-sm leading-7",
                        m.role === "user" ? "bg-[var(--color-primary)] text-white" : "bg-[var(--color-surface-muted)] text-[var(--color-ink)]"
                      )}
                    >
                      {m.content}
                    </p>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-end" role="status">
                    <p className="rounded-[var(--radius-lg)] bg-[var(--color-surface-muted)] px-4 py-2.5 text-sm text-[var(--color-ink-muted)]">جاري التفكير…</p>
                  </div>
                )}
              </div>

              {error && (
                <div role="alert" className="mx-4 mb-2 rounded-[var(--radius-md)] border border-[var(--color-danger)]/20 bg-[var(--color-danger-light)] px-3.5 py-2.5 text-sm text-[var(--color-danger)]">
                  {error.message}{" "}
                  {error.retryText && (
                    <button className="font-medium underline" onClick={() => void send(error.retryText!, { silent: true })}>إعادة المحاولة</button>
                  )}
                </div>
              )}

              {aiDown && (
                <p className="mx-4 mb-2 text-sm text-[var(--color-ink-muted)]">
                  المساعد الذكي غير متاح حاليًا — <Link to="/doctors" className="text-[var(--color-primary)] underline">ابحث عن طبيب يدويًا</Link>.
                </p>
              )}

              <form onSubmit={onSubmit} className="flex items-end gap-2 border-t border-[var(--color-border)] p-3">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      onSubmit(e);
                    }
                  }}
                  dir="auto"
                  rows={2}
                  maxLength={2000}
                  aria-label="اكتب رسالتك"
                  placeholder="اكتب أعراضك أو إجابتك هنا…"
                  className="min-h-11 flex-1 resize-none rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white p-3 text-sm"
                />
                <Button type="submit" disabled={loading || !input.trim()} aria-label="إرسال" className="h-11 w-11 px-0">
                  <Send className="h-4 w-4 rtl:-scale-x-100" />
                </Button>
              </form>
            </section>

            {/* اللوحة الجانبية */}
            <div className="space-y-4">
              {emergency && <EmergencyBanner reasons={emergency.reasons} selfHarm={emergency.selfHarm} />}

              {showQuestions &&
                state!.follow_up_questions.map((q) => (
                  <StructuredQuestion key={q.id} question={q} disabled={loading} onAnswer={(a) => void send(a)} />
                ))}

              {showSummary && (
                <SymptomSummaryCard
                  summary={state!.symptom_summary}
                  disabled={loading}
                  onConfirm={() => void send("نعم، الملخص صحيح. اقترح لي التخصصات المناسبة.")}
                  onCorrect={(c) => void send(`تصحيح: ${c}`)}
                />
              )}

              {emergency && (
                <p className="text-sm text-[var(--color-ink-muted)]">
                  لن نعرض ترشيحات أطباء عادية الآن لأن حالتك قد تحتاج تقييمًا عاجلًا. إذا كانت حالتك غير طارئة فعلًا يمكنك{" "}
                  <Link to="/doctors" className="text-[var(--color-primary)] underline">تصفّح الأطباء</Link>.
                </p>
              )}

              {!emergency && state?.stage === "recommendations" && (
                <section aria-label="الأطباء المقترحون" className="space-y-3">
                  {state.recommended_specialties.length > 0 && (
                    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 text-sm">
                      <h2 className="mb-2 font-medium text-[var(--color-ink)]">تخصصات قد تكون مناسبة</h2>
                      <ul className="space-y-1.5 text-[var(--color-ink-muted)]">
                        {state.recommended_specialties.map((s) => (
                          <li key={s.name}><span className="font-medium text-[var(--color-ink)]">{s.name}</span> — {s.reason}</li>
                        ))}
                      </ul>
                      <p className="mt-2 text-xs text-[var(--color-ink-faint)]">اقتراح للتوجيه فقط وليس تشخيصًا، وقد لا يكون التخصص الأنسب فعليًا.</p>
                    </div>
                  )}

                  {loadingDoctors && <div className="h-28 animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-surface-muted)]" />}
                  {recsError && <p role="alert" className="text-sm text-[var(--color-danger)]">تعذّر تحميل الأطباء الآن. <Link to="/doctors" className="underline">تصفّح كل الأطباء</Link>.</p>}

                  {recs && recs.matched.length > 0 && (
                    <>
                      <p className="text-xs text-[var(--color-ink-faint)]">الترتيب للتسهيل فقط: توفر المواعيد ثم صلة التخصص ثم التقييم ثم السعر — وليس ضمانًا للأنسب طبيًا.</p>
                      {recs.matched.map((r) => <DoctorRecommendationCard key={r.doctor.doctor_id} rec={r} />)}
                    </>
                  )}

                  {recs && recs.matched.length === 0 && !loadingDoctors && (
                    <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-strong)] bg-white p-5 text-center text-sm text-[var(--color-ink-muted)]">
                      لا يوجد حاليًا أطباء نشطون في التخصصات المقترحة{recs.unmatchedSpecialties.length > 0 ? ` (${recs.unmatchedSpecialties.join("، ")} غير متوفرة في المنصة)` : ""}.
                      <div className="mt-3"><Link to="/doctors"><Button size="sm" variant="outline">تصفّح كل الأطباء</Button></Link></div>
                    </div>
                  )}
                </section>
              )}

              <Button variant="ghost" size="sm" onClick={restart}><RotateCcw className="h-4 w-4" /> بدء تقييم جديد</Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
