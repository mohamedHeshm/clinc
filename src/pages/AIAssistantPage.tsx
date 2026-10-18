import * as React from "react";
import { Link } from "react-router-dom";
import { Bot, LockKeyhole, RotateCcw, Send, ShieldAlert, Stethoscope } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { EmergencyBanner } from "@/components/ai-assistant/EmergencyBanner";
import { DoctorRecommendationCard } from "@/components/ai-assistant/DoctorRecommendationCard";
import { AssistantError, findDoctorsForSpecialties, sendAssistantMessage, type RecommendationResult } from "@/services/aiAssistant.service";
import type { AssistantResponse, ChatMessage } from "@/types/aiAssistant";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "clinic.ai-assistant.v1";
const GREETING: ChatMessage = { id: "greeting", role: "assistant", content: "أهلاً بيك، احكيلي إيه الأعراض اللي حاسس بيها، وبقالها قد إيه؟" };
interface Persisted { sessionId: string | null; messages: ChatMessage[]; }

function loadPersisted(): Persisted {
  try { const raw = sessionStorage.getItem(STORAGE_KEY); if (raw) return JSON.parse(raw) as Persisted; } catch { /* Ignore. */ }
  return { sessionId: null, messages: [GREETING] };
}

function responseText(response: AssistantResponse): string | null {
  if (response.reply_text?.trim()) return response.reply_text.trim();
  return response.follow_up_questions[0]?.prompt.trim() || null;
}

export default function AIAssistantPage() {
  const { session, isLoading: authLoading } = useAuth();
  const [persisted] = React.useState<Persisted>(loadPersisted);
  const [sessionId, setSessionId] = React.useState<string | null>(persisted.sessionId);
  const [messages, setMessages] = React.useState<ChatMessage[]>(persisted.messages.length ? persisted.messages : [GREETING]);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [state, setState] = React.useState<AssistantResponse | null>(null);
  const [emergency, setEmergency] = React.useState<{ reasons: string[]; selfHarm: boolean } | null>(null);
  const [error, setError] = React.useState<{ message: string; retryText: string } | null>(null);
  const [aiDown, setAiDown] = React.useState(false);
  const [recs, setRecs] = React.useState<RecommendationResult | null>(null);
  const [loadingDoctors, setLoadingDoctors] = React.useState(false);
  const [recsError, setRecsError] = React.useState(false);
  const listRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => { try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ sessionId, messages })); } catch { /* Ignore. */ } }, [sessionId, messages]);
  React.useEffect(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" }); }, [messages, loading, error]);

  const send = React.useCallback(async (text: string, retry = false) => {
    const clean = text.trim();
    if (!clean || loading) return;
    setError(null);
    if (!retry) setMessages((current) => [...current, { id: crypto.randomUUID(), role: "user", content: clean }]);
    setLoading(true);
    try {
      const response = await sendAssistantMessage({ sessionId, message: clean });
      setSessionId(response.sessionId); setState(response); setAiDown(Boolean(response.ai_error));
      if (response.is_emergency) setEmergency({ reasons: response.emergency_reasons, selfHarm: response.is_self_harm_related });
      const reply = responseText(response);
      if (reply) setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", content: reply }]);
    } catch (caught) {
      const message = caught instanceof AssistantError ? caught.message : "تعذّر إرسال الرسالة. حاول مرة أخرى.";
      setError({ message, retryText: clean });
      if (caught instanceof AssistantError && caught.code === "UNAVAILABLE") setAiDown(true);
    } finally { setLoading(false); }
  }, [loading, sessionId]);

  React.useEffect(() => {
    if (!state || state.stage !== "recommendations" || state.is_emergency || state.recommended_specialties.length === 0) return;
    let active = true;
    setLoadingDoctors(true); setRecsError(false);
    findDoctorsForSpecialties(state.recommended_specialties)
      .then((result) => active && setRecs(result))
      .catch(() => active && setRecsError(true))
      .finally(() => active && setLoadingDoctors(false));
    return () => { active = false; };
  }, [state]);

  const restart = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    setSessionId(null); setMessages([GREETING]); setState(null); setEmergency(null); setRecs(null); setError(null); setAiDown(false); setInput("");
    requestAnimationFrame(() => inputRef.current?.focus());
  };
  const onSubmit = (event: React.FormEvent) => { event.preventDefault(); const message = input; if (!message.trim() || loading) return; setInput(""); void send(message); };
  if (authLoading) return null;

  return (
    <div className="bg-background">
      <main id="main-content" className="mx-auto w-full max-w-5xl px-3 py-4 sm:px-6 sm:py-8">
        {!session ? (
          <section className="mx-auto max-w-lg rounded-2xl border border-border bg-surface p-6 text-center shadow-soft sm:p-8">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground"><Stethoscope className="h-6 w-6" /></div>
            <h1 className="mt-4 text-xl font-semibold text-foreground">المساعد الطبي</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">سجّل دخولك لبدء محادثة خاصة تساعدك في معرفة التخصص المناسب.</p>
            <div className="mt-5 grid gap-2 sm:grid-cols-2"><Link to="/login" state={{ from: "/ai-assistant" }}><Button className="w-full">تسجيل الدخول</Button></Link><Link to="/doctors"><Button className="w-full" variant="outline">تصفّح الأطباء</Button></Link></div>
          </section>
        ) : (
          <section className="flex min-h-[calc(100dvh-9rem)] flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-elevated sm:min-h-[calc(100dvh-11rem)]">
            <header className="flex shrink-0 items-center gap-3 bg-[#164E52] px-4 py-3.5 text-white sm:px-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15"><Bot className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1"><h1 className="truncate text-base font-semibold sm:text-lg">المساعد الطبي</h1><p className="truncate text-xs text-white/75 sm:text-sm">مساعدك لمعرفة التخصص المناسب</p></div>
              <span className="hidden items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs text-white/85 sm:inline-flex"><LockKeyhole className="h-3.5 w-3.5" />محادثة خاصة</span>
              <Button type="button" variant="ghost" size="sm" className="shrink-0 text-white hover:bg-white/10 hover:text-white" onClick={restart}><RotateCcw className="h-4 w-4" /><span className="hidden sm:inline">محادثة جديدة</span></Button>
            </header>
            <div className="flex min-h-0 flex-1 flex-col">
              <div ref={listRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain bg-[#FAF9F6] px-3 py-4 sm:px-5 sm:py-5" aria-live="polite">
                <div className="flex items-start gap-2 rounded-xl border border-warning/25 bg-warning/10 px-3 py-2.5 text-xs leading-5 text-foreground sm:text-sm"><ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning" /><p>للتوجيه الصحي فقط، وليس تشخيصًا أو وصفة علاجية. في حالات الطوارئ اتصل بالإسعاف فورًا.</p></div>
                {messages.map((message) => <div key={message.id} className={cn("flex", message.role === "user" ? "justify-start" : "justify-end")}><p dir="auto" className={cn("max-w-[92%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-sm leading-7 shadow-soft sm:max-w-[78%] sm:px-4", message.role === "user" ? "rounded-tr-md bg-[#DDECE8] text-[#164E52]" : "rounded-tl-md bg-white text-foreground")}>{message.content}</p></div>)}
                {loading && <div className="flex justify-end" role="status"><div className="rounded-2xl rounded-tl-md bg-white px-4 py-3 shadow-soft"><span className="inline-flex gap-1"><i className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.2s]" /><i className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.1s]" /><i className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" /></span><span className="sr-only">جاري التفكير</span></div></div>}
                {emergency && <EmergencyBanner reasons={emergency.reasons} selfHarm={emergency.selfHarm} />}
                {!emergency && state?.stage === "recommendations" && <section className="space-y-3"><div className="rounded-xl border border-border bg-white p-4 text-sm"><h2 className="font-semibold text-foreground">تخصصات قد تكون مناسبة</h2><ul className="mt-2 space-y-1.5 text-muted-foreground">{state.recommended_specialties.map((specialty) => <li key={specialty.name}><span className="font-medium text-foreground">{specialty.name}</span> — {specialty.reason}</li>)}</ul></div>{loadingDoctors && <div className="h-28 animate-pulse rounded-xl bg-surface-muted" />}{recsError && <p className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">تعذّر تحميل الأطباء الآن. <Link to="/doctors" className="underline">تصفّح كل الأطباء</Link>.</p>}{recs?.matched.map((recommendation) => <DoctorRecommendationCard key={recommendation.doctor.doctor_id} rec={recommendation} />)}{recs && recs.matched.length === 0 && !loadingDoctors && <Link to="/doctors"><Button variant="outline" className="w-full">تصفّح كل الأطباء</Button></Link>}</section>}
              </div>
              <div className="shrink-0 border-t border-border bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4">
                {error && <div role="alert" className="mb-2 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive"><span>{error.message}</span><button type="button" className="font-semibold underline" onClick={() => void send(error.retryText, true)}>إعادة المحاولة</button></div>}
                {aiDown && <p className="mb-2 text-xs text-muted-foreground">المساعد غير متاح الآن. <Link to="/doctors" className="font-medium text-primary underline">ابحث عن طبيب يدويًا</Link>.</p>}
                <form onSubmit={onSubmit} className="flex items-end gap-2"><textarea ref={inputRef} value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); onSubmit(event); } }} dir="auto" rows={1} maxLength={2000} aria-label="اكتب رسالتك" placeholder="اكتب أعراضك أو إجابتك هنا…" className="min-h-11 max-h-32 min-w-0 flex-1 resize-y rounded-xl border border-border bg-[#FAF9F6] px-3 py-2.5 text-sm leading-6 outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/25" /><Button type="submit" disabled={loading || !input.trim()} aria-label="إرسال" className="h-11 w-11 shrink-0 rounded-xl px-0"><Send className="h-4 w-4 rtl:-scale-x-100" /></Button></form>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
