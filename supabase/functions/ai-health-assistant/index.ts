// supabase/functions/ai-health-assistant/index.ts
//
// المساعد الصحي الذكي — نقطة الدخول الوحيدة للتواصل مع مزوّد الذكاء
// الاصطناعي. مفتاح الـ API لا يُكشف أبدًا للواجهة الأمامية — يُقرأ هنا فقط
// من ANTHROPIC_API_KEY (Supabase Secret).
//
// مسؤوليات هذا الملف بالترتيب:
//   1) التحقق من تسجيل الدخول (لا استخدام مجهول الهوية — لتفعيل Rate Limiting)
//   2) تطبيق حد استخدام بسيط لكل مستخدم (Rate Limiting)
//   3) فحص طوارئ حتمي (Deterministic Ruleset) مستقل تمامًا عن الذكاء
//      الاصطناعي — يعمل حتى لو فشل استدعاء الذكاء الاصطناعي بالكامل
//   4) استدعاء Anthropic Messages API مع إجبار إخراج مُهيكل (Tool Use)
//   5) التحقق من صحة الإخراج المُهيكل قبل استخدامه (Schema Validation)
//   6) حفظ/تحديث الجلسة في قاعدة البيانات (بيانات مُهيكلة فقط، لا أرشيف دردشة)
//   7) إرجاع استجابة مُهيكلة وآمنة للواجهة الأمامية
//
//
// نشر: supabase functions deploy ai-health-assistant
// إعداد السر المطلوب: supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
// (اختياري) supabase secrets set ANTHROPIC_MODEL=claude-sonnet-4-5-20250929

import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const ANTHROPIC_MODEL = Deno.env.get("ANTHROPIC_MODEL") || "claude-sonnet-4-5-20250929";

const MAX_SESSIONS_PER_HOUR = 8;
const AI_TIMEOUT_MS = 20_000;
const MAX_RECENT_TURNS_KEPT = 12; // آخر 12 رسالة فقط تُحفظ كسياق، وليس أرشيف كامل

// ----------------------------------------------------------------------------
// [1] فحص الطوارئ الحتمي — مستقل تمامًا عن الذكاء الاصطناعي، ويعمل حتى لو
//     فشل استدعاء الذكاء الاصطناعي بالكامل. هذه قائمة أنماط حمراء واسعة
//     وليست نظام فرز طبي معتمد — يجب مراجعتها وتوسيعها من فريق طبي مؤهل
//     قبل أي استخدام إنتاجي حقيقي (انظر ملاحظة "تنبيه" في نهاية الدالة).
// ----------------------------------------------------------------------------
import { runEmergencyRuleset } from "./emergency.ts";

// ----------------------------------------------------------------------------
// [2] مخطط الإخراج المُهيكل الذي نُجبر Claude على الالتزام به عبر Tool Use
// ----------------------------------------------------------------------------
const ASSESSMENT_TOOL = {
  name: "provide_assessment_response",
  description: "قدّم الرد المُهيكل التالي للمساعد الصحي بناءً على المحادثة الحالية.",
  input_schema: {
    type: "object",
    properties: {
      reply_text: {
        type: "string",
        description: "رد نصي قصير وودود ومهني يُعرض للمريض مباشرة (بنفس لغته: عربي أو إنجليزي).",
      },
      stage: {
        type: "string",
        enum: ["collecting", "ready_for_summary", "recommendations"],
        description: "collecting: لا تزال تجمع معلومات. ready_for_summary: لديك معلومات كافية لعرض ملخص. recommendations: المريض أكّد الملخص وتريد اقتراح تخصصات.",
      },
      follow_up_questions: {
        type: "array",
        description: "سؤال أو اثنان كحد أقصى في كل مرة — لا تُثقل المريض بعدة أسئلة دفعة واحدة.",
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
            type: { type: "string", enum: ["single_choice", "multi_choice", "severity_scale", "duration", "yes_no", "free_text"] },
            prompt: { type: "string" },
            options: { type: "array", items: { type: "string" } },
          },
          required: ["id", "type", "prompt"],
        },
      },
      symptom_summary: {
        type: "object",
        description: "آخر نسخة مُحدَّثة من ملخص الحالة، تتراكم مع كل رسالة.",
        properties: {
          symptoms: { type: "array", items: { type: "string" } },
          duration: { type: ["string", "null"] },
          severity: { type: ["string", "null"] },
          context: { type: ["string", "null"] },
        },
      },
      ai_suspected_emergency: {
        type: "boolean",
        description: "تقييمك الخاص (بجانب الفحص الحتمي المنفصل) هل هذا الوصف قد يكون حالة طارئة.",
      },
      ai_emergency_reason: { type: ["string", "null"] },
      recommended_specialties: {
        type: "array",
        description: "فقط في مرحلة recommendations. لا تخترع أسماء أطباء أو تخصصات غير طبية شائعة.",
        items: {
          type: "object",
          properties: {
            name: { type: "string", description: "اسم التخصص الطبي بالعربي (مثال: باطنة، جلدية، عظام)." },
            confidence_label: { type: "string", enum: ["high", "medium", "low"] },
            reason: { type: "string" },
          },
          required: ["name", "confidence_label", "reason"],
        },
      },
    },
    required: ["reply_text", "stage", "symptom_summary", "ai_suspected_emergency"],
  },
};

const SYSTEM_PROMPT = `أنت "المساعد الصحي الذكي" داخل منصة طبية اسمها Clinic. دورك هو مساعدة
المريض على وصف أعراضه وفهم أي تخصص طبي قد يكون مناسبًا — أنت لست طبيبًا
ولا تُشخِّص حالات ولا تصف أدوية أو جرعات إطلاقًا، ولا تؤكد أبدًا أن حالة
خطيرة مستبعدة.

التزم بالتالي دائمًا:
- تحدّث بنفس لغة المريض (عربي مصري عامي مفهوم، أو فصحى، أو إنجليزي).
- اسأل سؤالًا أو سؤالين فقط في كل مرة، ولا تكرر سؤالًا أُجيب عنه بالفعل.
- كن مختصرًا وواضحًا ومتعاطفًا، بدون إطالة.
- لا تذكر اسم أي طبيب أو سعر أو تقييم أو موعد — هذه تأتي من قاعدة البيانات
  الفعلية بعد انتهاء المحادثة، وليس منك.
- عند stage = recommendations، اقترح تخصصات طبية عامة شائعة فقط (مثل: باطنة،
  قلب، جلدية، عظام، أطفال، نساء وتوليد، أنف وأذن وحنجرة، عيون، مسالك بولية،
  نفسي) — ولا تخترع تخصصات غير موجودة عادة في عيادات حقيقية.
- لا تُقلّل أبدًا من احتمال وجود حالة خطيرة، ولا تطمئن المريض بأن شيئًا
  "مش خطير" بثقة. دائمًا وضّح أن هذا تقييم أولي فقط وليس تشخيصًا.
يجب عليك دائمًا الرد فقط عبر استدعاء الأداة provide_assessment_response —
لا ترد بنص عادي خارجها مطلقًا.`;

// ----------------------------------------------------------------------------
// النوع الذي نتوقعه من المريض في الطلب، والاستجابة النهائية المُرسَلة له
// ----------------------------------------------------------------------------
interface IncomingTurn {
  role: "user" | "assistant";
  content: string;
}

interface RequestBody {
  sessionId?: string | null;
  message: string;
  priorTurns?: IncomingTurn[];
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

    // ---- المصادقة: لازم تسجيل دخول فعلي ----
    const authHeader = req.headers.get("Authorization") ?? "";
    const callerClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await callerClient.auth.getUser();
    if (userErr || !userData.user) {
      return json({ error: "يجب تسجيل الدخول لاستخدام المساعد الصحي الذكي" }, 401);
    }
    const patientId = userData.user.id;

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const body = (await req.json()) as RequestBody;
    const message = (body.message ?? "").trim();
    if (!message) return json({ error: "الرسالة فارغة" }, 400);
    if (message.length > 2000) return json({ error: "الرسالة طويلة جدًا" }, 400);

    // ---- تحميل أو إنشاء الجلسة ----
    let session: Record<string, unknown> | null = null;
    if (body.sessionId) {
      const { data } = await admin
        .from("ai_assessment_sessions")
        .select("*")
        .eq("id", body.sessionId)
        .eq("patient_id", patientId)
        .maybeSingle();
      session = data;
    }

    if (!session) {
      // ---- Rate limiting: فقط عند إنشاء جلسة جديدة ----
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { data: recentCount } = await admin.rpc("count_recent_ai_sessions", {
        p_patient_id: patientId,
        p_since: oneHourAgo,
      });
      if ((recentCount ?? 0) >= MAX_SESSIONS_PER_HOUR) {
        return json(
          { error: "لقد استخدمت المساعد الصحي عدة مرات خلال الساعة الماضية، برجاء المحاولة لاحقًا." },
          429
        );
      }

      const { data: created, error: createErr } = await admin
        .from("ai_assessment_sessions")
        .insert({ patient_id: patientId })
        .select("*")
        .single();
      if (createErr || !created) return json({ error: "تعذّر بدء جلسة جديدة" }, 500);
      session = created;
    }

    // ---- [3] فحص الطوارئ الحتمي: يعمل دائمًا، حتى لو فشل الذكاء الاصطناعي ----
    const priorText = ((session.recent_turns as IncomingTurn[]) ?? []).map((t) => t.content).join(" ");
    const ruleCheck = runEmergencyRuleset(`${priorText} ${message}`);

    // ---- [4] استدعاء Anthropic — مع مهلة زمنية ومعالجة فشل كاملة ----
    let aiResult: Record<string, unknown> | null = null;
    let aiError: string | null = null;

    if (!ANTHROPIC_API_KEY) {
      aiError = "AI_NOT_CONFIGURED";
    } else {
      try {
        const turns: IncomingTurn[] = [
          ...((session.recent_turns as IncomingTurn[]) ?? []),
          { role: "user", content: message },
        ];

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: ANTHROPIC_MODEL,
            max_tokens: 1200,
            system: SYSTEM_PROMPT,
            messages: turns.map((t) => ({ role: t.role, content: t.content })),
            tools: [ASSESSMENT_TOOL],
            tool_choice: { type: "tool", name: "provide_assessment_response" },
          }),
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (!res.ok) {
          aiError = res.status === 429 ? "AI_RATE_LIMITED" : "AI_REQUEST_FAILED";
        } else {
          const data = await res.json();
          const toolUse = (data.content ?? []).find((b: { type: string }) => b.type === "tool_use");
          if (!toolUse) {
            aiError = "AI_INVALID_RESPONSE";
          } else {
            aiResult = validateAssessmentOutput(toolUse.input);
            if (!aiResult) aiError = "AI_INVALID_RESPONSE";
          }
        }
      } catch (e) {
        aiError = e instanceof Error && e.name === "AbortError" ? "AI_TIMEOUT" : "AI_REQUEST_FAILED";
      }
    }

    // ---- دمج نتيجة الفحص الحتمي مع تقييم الذكاء الاصطناعي (الحتمي له الأولوية دائمًا) ----
    const isEmergency = ruleCheck.isEmergency || Boolean(aiResult?.ai_suspected_emergency);
    const emergencyReasons = [
      ...ruleCheck.reasons,
      ...(aiResult?.ai_suspected_emergency && aiResult?.ai_emergency_reason ? [String(aiResult.ai_emergency_reason)] : []),
    ];

    // ---- تحديث الجلسة في قاعدة البيانات (بيانات مُهيكلة فقط) ----
    const updatedTurns: IncomingTurn[] = [
      ...((session.recent_turns as IncomingTurn[]) ?? []),
      { role: "user", content: message },
      ...(aiResult ? [{ role: "assistant" as const, content: String(aiResult.reply_text) }] : []),
    ].slice(-MAX_RECENT_TURNS_KEPT);

    const mergedSummary = aiResult?.symptom_summary ?? session.symptom_summary ?? {};
    const stage = (aiResult?.stage as string) ?? "collecting";
    const newStatus =
      stage === "recommendations" ? "recommended" : stage === "ready_for_summary" ? "summary_ready" : "in_progress";

    const { data: updatedSession, error: updateErr } = await admin
      .from("ai_assessment_sessions")
      .update({
        status: isEmergency ? session.status : newStatus,
        symptom_summary: mergedSummary,
        recent_turns: updatedTurns,
        is_emergency: isEmergency,
        emergency_reasons: emergencyReasons,
        recommended_specialties: aiResult?.recommended_specialties ?? session.recommended_specialties ?? [],
      })
      .eq("id", session.id)
      .select("*")
      .single();

    if (updateErr) return json({ error: "تعذّر حفظ الجلسة" }, 500);

    return json({
      sessionId: updatedSession.id,
      reply_text: aiResult?.reply_text ?? null,
      stage: aiResult?.stage ?? "collecting",
      follow_up_questions: isEmergency ? [] : (aiResult?.follow_up_questions ?? []),
      symptom_summary: updatedSession.symptom_summary,
      is_emergency: isEmergency,
      is_self_harm_related: ruleCheck.selfHarm,
      emergency_reasons: emergencyReasons,
      recommended_specialties: updatedSession.recommended_specialties,
      ai_error: aiError, // null يعني كل شيء تمام؛ غير ذلك الواجهة تعرض رسالة بديلة مناسبة
    });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "خطأ غير متوقع" }, 500);
  }
});

// ----------------------------------------------------------------------------
// التحقق من مطابقة إخراج الذكاء الاصطناعي للمخطط المتوقع قبل استخدامه إطلاقًا
// ----------------------------------------------------------------------------
function validateAssessmentOutput(input: unknown): Record<string, unknown> | null {
  if (typeof input !== "object" || input === null) return null;
  const obj = input as Record<string, unknown>;

  if (typeof obj.reply_text !== "string" || !obj.reply_text.trim()) return null;
  if (!["collecting", "ready_for_summary", "recommendations"].includes(String(obj.stage))) return null;
  if (typeof obj.ai_suspected_emergency !== "boolean") return null;

  if (obj.follow_up_questions !== undefined && !Array.isArray(obj.follow_up_questions)) return null;
  if (obj.recommended_specialties !== undefined && !Array.isArray(obj.recommended_specialties)) return null;

  // حد أقصى سؤالين في كل رد — حماية إضافية حتى لو تجاهل النموذج التعليمات
  if (Array.isArray(obj.follow_up_questions) && obj.follow_up_questions.length > 2) {
    obj.follow_up_questions = obj.follow_up_questions.slice(0, 2);
  }

  return obj;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

// ============================================================================
// تنبيه مهم (يُرجى عدم حذفه): قائمة EMERGENCY_RULES أعلاه قائمة أنماط
// نصية واسعة بُنيت كنقطة بداية معقولة، وليست أداة فرز طبي (Triage) معتمدة
// سريريًا. قبل أي استخدام إنتاجي حقيقي يتعامل مع مرضى فعليين، يجب أن
// يراجعها ويُوسّعها طاقم طبي مؤهل (أطباء طوارئ/عائلة)، ويُفضَّل الاستعانة
// بمرجع طبي معتمد للأعراض الحرجة بدل قائمة يدوية ثابتة.
// ============================================================================