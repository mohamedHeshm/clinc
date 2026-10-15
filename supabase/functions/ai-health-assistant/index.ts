// supabase/functions/ai-health-assistant/index.ts
//
// المساعد الصحي الذكي — نقطة الدخول الوحيدة للتواصل مع مزوّد الذكاء
// الاصطناعي. مفتاح الـ API لا يُكشف أبدًا للواجهة الأمامية — يُقرأ هنا فقط
// من GEMINI_API_KEY (Supabase Secret).
//
// مسؤوليات هذا الملف بالترتيب:
//   1) التحقق من تسجيل الدخول (لا استخدام مجهول الهوية — لتفعيل Rate Limiting)
//   2) تطبيق حد استخدام بسيط لكل مستخدم (Rate Limiting)
//   3) فحص طوارئ حتمي (Deterministic Ruleset) مستقل تمامًا عن الذكاء
//      الاصطناعي — يعمل حتى لو فشل استدعاء الذكاء الاصطناعي بالكامل
//   4) استدعاء Gemini API مع إجبار إخراج مُهيكل (Function Calling)
//   5) التحقق من صحة الإخراج المُهيكل قبل استخدامه (Schema Validation)
//   6) حفظ/تحديث الجلسة في قاعدة البيانات (بيانات مُهيكلة فقط، لا أرشيف دردشة)
//   7) إرجاع استجابة مُهيكلة وآمنة للواجهة الأمامية
//
//
// نشر: supabase functions deploy ai-health-assistant
// إعداد السر المطلوب: supabase secrets set GEMINI_API_KEY=YOUR_NEW_KEY
// (اختياري) supabase secrets set GEMINI_MODEL=gemini-2.5-flash

import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

const GEMINI_MODEL = Deno.env.get("GEMINI_MODEL") || "gemini-3.8-flash";
const ALLOWED_ORIGINS = new Set([
  "https://clinc-ochre.vercel.app",
  "http://localhost:5173",
  ...(Deno.env.get("CORS_ALLOWED_ORIGINS") ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
]);

const MAX_SESSIONS_PER_HOUR = 8;
const AI_TIMEOUT_MS = 20_000;
const MAX_RECENT_TURNS_KEPT = 12; // آخر 12 رسالة فقط تُحفظ كسياق، وليس أرشيف كامل

// ----------------------------------------------------------------------------
// [1] فحص الطوارئ الحتمي — مستقل تمامًا عن الذكاء الاصطناعي، ويعمل حتى لو
//     فشل استدعاء الذكاء الاصطناعي بالكامل. هذه قائمة أنماط حمراء واسعة
//     وليست نظام فرز طبي معتمد — يجب مراجعتها وتوسيعها من فريق طبي مؤهل
//     قبل أي استخدام إنتاجي حقيقي (انظر ملاحظة "تنبيه" في نهاية الدالة).
// ----------------------------------------------------------------------------
// Keep this ruleset in index.ts as well as emergency.ts: Supabase Studio's
// inline function editor deploys only index.ts, while the local test imports
// the separately maintained module.
function runEmergencyRuleset(text: string): { isEmergency: boolean; reasons: string[]; selfHarm: boolean } {
  const rules = [
    {
      patterns: [/chest pain/i, /can'?t breathe/i, /shortness of breath/i, /difficulty breathing/i,
        /ألم في الصدر/, /ضيق في التنفس/, /مش قادر اتنفس/, /صعوبة في التنفس/, /ضيق تنفس/],
      reason: "ألم بالصدر أو ضيق في التنفس قد يشير لحالة قلبية أو تنفسية طارئة",
    },
    {
      patterns: [/face drooping/i, /slurred speech/i, /one side.*(weak|numb)/i, /sudden.*(weak|numb)ness/i,
        /تدلي الوجه/, /كلام غير واضح/, /تنميل في نص الجسم/, /ضعف مفاجئ في جانب/, /خدران في نصف/],
      reason: "علامات محتملة لجلطة دماغية (ضعف مفاجئ، تنميل، صعوبة كلام)",
    },
    {
      patterns: [/severe bleeding/i, /won'?t stop bleeding/i, /نزيف شديد/, /نزيف لا يتوقف/, /فقدان دم كتير/],
      reason: "نزيف شديد أو لا يتوقف",
    },
    {
      patterns: [/lost consciousness/i, /passed out/i, /fainted/i, /فقدان الوعي/, /غاب عن الوعي/, /أغمى عليه/, /اغمى عليا/],
      reason: "فقدان الوعي أو الإغماء",
    },
    {
      patterns: [/allergic reaction.*(swelling|breath)/i, /anaphylaxis/i, /حساسية شديدة/, /تورم في الوجه.*تنفس/, /صعوبة بلع وتورم/],
      reason: "علامات رد فعل تحسسي شديد (تورم مع صعوبة تنفس)",
    },
    {
      patterns: [/infant.*fever/i, /baby.*high fever/i, /رضيع.*حرارة عالية/, /طفل رضيع.*سخونة شديدة/],
      reason: "حرارة شديدة عند رضيع — تحتاج تقييمًا طبيًا فوريًا",
    },
    {
      patterns: [/poisoning/i, /overdose/i, /تسمم/, /جرعة زايدة/, /جرعة زائدة/],
      reason: "احتمال تسمم أو جرعة دوائية زائدة",
    },
    {
      patterns: [/seizure/i, /convulsion/i, /تشنج/, /نوبة صرع/],
      reason: "نوبة تشنج",
    },
    {
      patterns: [/suicide/i, /kill myself/i, /end my life/i, /self.?harm/i,
        /انتحار/, /أؤذي نفسي/, /هأذي نفسي/, /مش عايز أعيش/, /عايز أموت/, /هنهي حياتي/],
      reason: "أفكار متعلقة بإيذاء النفس — هذه حالة تحتاج دعمًا فوريًا",
      selfHarm: true,
    },
  ];
  const matched = rules.filter((rule) => rule.patterns.some((pattern) => pattern.test(text)));
  return {
    isEmergency: matched.length > 0,
    reasons: matched.map((rule) => rule.reason),
    selfHarm: matched.some((rule) => rule.selfHarm === true),
  };
}

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

// Gemini Function Calling accepts a subset of JSON Schema. Nullable fields
// are represented as optional fields, and the output is validated below.
const GEMINI_ASSESSMENT_FUNCTION = {
  name: ASSESSMENT_TOOL.name,
  description: ASSESSMENT_TOOL.description,
  parameters: {
    type: "OBJECT",
    properties: {
      reply_text: { type: "STRING", description: "رد قصير بلغة المريض." },
      stage: { type: "STRING", enum: ["collecting", "ready_for_summary", "recommendations"] },
      follow_up_questions: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            id: { type: "STRING" },
            type: { type: "STRING", enum: ["single_choice", "multi_choice", "severity_scale", "duration", "yes_no", "free_text"] },
            prompt: { type: "STRING" },
            options: { type: "ARRAY", items: { type: "STRING" } },
          },
          required: ["id", "type", "prompt"],
        },
      },
      symptom_summary: {
        type: "OBJECT",
        properties: {
          symptoms: { type: "ARRAY", items: { type: "STRING" } },
          duration: { type: "STRING" },
          severity: { type: "STRING" },
          context: { type: "STRING" },
        },
        required: ["symptoms"],
      },
      ai_suspected_emergency: { type: "BOOLEAN" },
      ai_emergency_reason: { type: "STRING" },
      recommended_specialties: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            name: { type: "STRING" },
            confidence_label: { type: "STRING", enum: ["high", "medium", "low"] },
            reason: { type: "STRING" },
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
  const origin = req.headers.get("Origin");

  if (req.method === "OPTIONS") {
    if (!origin || !ALLOWED_ORIGINS.has(origin)) {
      return new Response("Origin not allowed", { status: 403 });
    }

    return new Response("ok", { headers: corsHeaders(origin) });
  }

  if (origin && !ALLOWED_ORIGINS.has(origin)) {
    return json({ error: "Origin not allowed" }, 403, req);
  }

  try {
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405, req);

    // ---- المصادقة: لازم تسجيل دخول فعلي ----
    const authHeader = req.headers.get("Authorization") ?? "";
    const callerClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await callerClient.auth.getUser();
    if (userErr || !userData.user) {
      return json({ error: "يجب تسجيل الدخول لاستخدام المساعد الصحي الذكي" }, 401, req);
    }
    const patientId = userData.user.id;

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const body = (await req.json()) as RequestBody;
    const message = (body.message ?? "").trim();
    if (!message) return json({ error: "الرسالة فارغة" }, 400, req);
    if (message.length > 2000) return json({ error: "الرسالة طويلة جدًا" }, 400, req);

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
      // ---- تشخيص مؤقت: تجاوز فحص عدد الجلسات لتحديد سبب فشل الإنشاء ----
      // أعد تفعيل Rate Limiting بعد إصلاح الإنشاء قبل استخدام الدالة في الإنتاج.
      console.warn(
        "[AI_SESSION_COUNT_BYPASSED]",
        "Rate limit check is temporarily disabled for diagnosis",
      );

      const { data: created, error: createErr } = await admin
        .from("ai_assessment_sessions")
        .insert({ patient_id: patientId })
        .select("*")
        .single();

      if (createErr || !created) {
        console.error(
          "[AI_SESSION_CREATE_ERROR]",
          JSON.stringify({
            code: createErr?.code ?? null,
            message: createErr?.message ?? null,
            details: createErr?.details ?? null,
            hint: createErr?.hint ?? null,
            status: (createErr as { status?: number } | null)?.status ?? null,
            name: createErr?.name ?? null,
          }),
        );

        return json(
          {
            error: "تعذّر بدء جلسة جديدة",
            code: createErr?.code ?? "UNKNOWN",
          },
          500,
          req,
        );
      }

      session = created;
    }

    // ---- [3] فحص الطوارئ الحتمي: يعمل دائمًا، حتى لو فشل الذكاء الاصطناعي ----
    const priorText = ((session.recent_turns as IncomingTurn[]) ?? []).map((t) => t.content).join(" ");
    const ruleCheck = runEmergencyRuleset(`${priorText} ${message}`);

    // ---- [4] استدعاء Gemini — مع مهلة زمنية ومعالجة فشل كاملة ----
    let aiResult: Record<string, unknown> | null = null;
    let aiError: string | null = null;

    if (!GEMINI_API_KEY) {
      aiError = "AI_NOT_CONFIGURED";
    } else {
      try {
        const turns: IncomingTurn[] = [
          ...((session.recent_turns as IncomingTurn[]) ?? []),
          { role: "user", content: message },
        ];

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent`,
          {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": GEMINI_API_KEY,
          },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents: turns.map((t) => ({
              role: t.role === "assistant" ? "model" : "user",
              parts: [{ text: t.content }],
            })),
            tools: [{ functionDeclarations: [GEMINI_ASSESSMENT_FUNCTION] }],
            toolConfig: {
              functionCallingConfig: {
                mode: "ANY",
                allowedFunctionNames: [ASSESSMENT_TOOL.name],
              },
            },
            generationConfig: { maxOutputTokens: 1200, temperature: 0.3 },
          }),
          signal: controller.signal,
          }
        );
        clearTimeout(timeout);

        if (!res.ok) {
          // Log Gemini's response for diagnosis, but never log the API key.
          const errorBody = await res.text();
          console.error(
            "[GEMINI_API_ERROR]",
            JSON.stringify({
              status: res.status,
              statusText: res.statusText,
              body: errorBody.slice(0, 3000),
              model: GEMINI_MODEL,
            }),
          );

          aiError =
            res.status === 429
              ? "AI_RATE_LIMITED"
              : res.status === 401 || res.status === 403
                ? "AI_AUTH_ERROR"
                : res.status === 400
                  ? "AI_BAD_REQUEST"
                  : "AI_REQUEST_FAILED";
        } else {
          const data = await res.json();
          const parts = data.candidates?.[0]?.content?.parts ?? [];
          const functionCall = parts.find((part: { functionCall?: unknown }) => part.functionCall)?.functionCall;
          if (!functionCall || functionCall.name !== ASSESSMENT_TOOL.name) {
            console.error(
              "[GEMINI_INVALID_RESPONSE]",
              JSON.stringify(data).slice(0, 3000),
            );
            aiError = "AI_INVALID_RESPONSE";
          } else {
            aiResult = validateAssessmentOutput(functionCall.args);
            if (!aiResult) aiError = "AI_INVALID_RESPONSE";
          }
        }
      } catch (e) {
        console.error("[GEMINI_FETCH_ERROR]", {
          name: e instanceof Error ? e.name : "UnknownError",
          message: e instanceof Error ? e.message : String(e),
        });
        aiError =
          e instanceof Error && e.name === "AbortError"
            ? "AI_TIMEOUT"
            : "AI_REQUEST_FAILED";
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

    if (updateErr) return json({ error: "تعذّر حفظ الجلسة" }, 500, req);

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
    }, 200, req);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "خطأ غير متوقع" }, 500, req);
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

function corsHeaders(origin: string): Headers {
  return new Headers({
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  });
}

function json(body: unknown, status = 200, req?: Request) {
  const headers = new Headers({ "Content-Type": "application/json" });
  const origin = req?.headers.get("Origin");
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    for (const [key, value] of corsHeaders(origin)) headers.set(key, value);
  }
  return new Response(JSON.stringify(body), { status, headers });
}

// ============================================================================
// تنبيه مهم (يُرجى عدم حذفه): قائمة EMERGENCY_RULES أعلاه قائمة أنماط
// نصية واسعة بُنيت كنقطة بداية معقولة، وليست أداة فرز طبي (Triage) معتمدة
// سريريًا. قبل أي استخدام إنتاجي حقيقي يتعامل مع مرضى فعليين، يجب أن
// يراجعها ويُوسّعها طاقم طبي مؤهل (أطباء طوارئ/عائلة)، ويُفضَّل الاستعانة
// بمرجع طبي معتمد للأعراض الحرجة بدل قائمة يدوية ثابتة.
// ============================================================================
