// فحص الطوارئ الحتمي — مستقل تمامًا عن الذكاء الاصطناعي (ملف منفصل ليسهل اختباره).
// تنبيه: قائمة أنماط واسعة كنقطة بداية، وليست أداة فرز طبي معتمدة سريريًا؛
// يجب أن يراجعها ويوسّعها طاقم طبي مؤهل قبل أي استخدام إنتاجي حقيقي.

export interface EmergencyRule {
  id: string;
  patterns: RegExp[];
  reason_ar: string;
  reason_en: string;
  is_self_harm?: boolean;
}

const EMERGENCY_RULES: EmergencyRule[] = [
  {
    id: "chest_pain_breathing",
    patterns: [
      /chest pain/i, /can'?t breathe/i, /shortness of breath/i, /difficulty breathing/i,
      /ألم في الصدر/, /ضيق في التنفس/, /مش قادر اتنفس/, /صعوبة في التنفس/, /ضيق تنفس/,
    ],
    reason_ar: "ألم بالصدر أو ضيق في التنفس قد يشير لحالة قلبية أو تنفسية طارئة",
    reason_en: "Chest pain or breathing difficulty may indicate a cardiac or respiratory emergency",
  },
  {
    id: "stroke_signs",
    patterns: [
      /face drooping/i, /slurred speech/i, /one side.*(weak|numb)/i, /sudden.*(weak|numb)ness/i,
      /تدلي الوجه/, /كلام غير واضح/, /تنميل في نص الجسم/, /ضعف مفاجئ في جانب/, /خدران في نصف/,
    ],
    reason_ar: "علامات محتملة لجلطة دماغية (ضعف مفاجئ، تنميل، صعوبة كلام)",
    reason_en: "Possible stroke signs (sudden weakness, numbness, speech difficulty)",
  },
  {
    id: "severe_bleeding",
    patterns: [
      /severe bleeding/i, /won'?t stop bleeding/i, /نزيف شديد/, /نزيف لا يتوقف/, /فقدان دم كتير/,
    ],
    reason_ar: "نزيف شديد أو لا يتوقف",
    reason_en: "Severe or uncontrolled bleeding",
  },
  {
    id: "loss_of_consciousness",
    patterns: [
      /lost consciousness/i, /passed out/i, /fainted/i, /فقدان الوعي/, /غاب عن الوعي/, /أغمى عليه/, /اغمى عليا/,
    ],
    reason_ar: "فقدان الوعي أو الإغماء",
    reason_en: "Loss of consciousness or fainting",
  },
  {
    id: "anaphylaxis",
    patterns: [
      /allergic reaction.*(swelling|breath)/i, /anaphylaxis/i,
      /حساسية شديدة/, /تورم في الوجه.*تنفس/, /صعوبة بلع وتورم/,
    ],
    reason_ar: "علامات رد فعل تحسسي شديد (تورم مع صعوبة تنفس)",
    reason_en: "Signs of severe allergic reaction (swelling with breathing difficulty)",
  },
  {
    id: "infant_high_fever",
    patterns: [
      /infant.*fever/i, /baby.*high fever/i, /رضيع.*حرارة عالية/, /طفل رضيع.*سخونة شديدة/,
    ],
    reason_ar: "حرارة شديدة عند رضيع — تحتاج تقييمًا طبيًا فوريًا",
    reason_en: "High fever in an infant requires immediate medical evaluation",
  },
  {
    id: "poisoning",
    patterns: [
      /poisoning/i, /overdose/i, /تسمم/, /جرعة زايدة/, /جرعة زائدة/,
    ],
    reason_ar: "احتمال تسمم أو جرعة دوائية زائدة",
    reason_en: "Possible poisoning or medication overdose",
  },
  {
    id: "seizure",
    patterns: [/seizure/i, /convulsion/i, /تشنج/, /نوبة صرع/],
    reason_ar: "نوبة تشنج",
    reason_en: "Seizure / convulsion",
  },
  {
    id: "self_harm",
    is_self_harm: true,
    patterns: [
      /suicide/i, /kill myself/i, /end my life/i, /self.?harm/i,
      /انتحار/, /أؤذي نفسي/, /هأذي نفسي/, /مش عايز أعيش/, /عايز أموت/, /هنهي حياتي/,
    ],
    reason_ar: "أفكار متعلقة بإيذاء النفس — هذه حالة تحتاج دعمًا فوريًا",
    reason_en: "Thoughts related to self-harm — this needs immediate support",
  },
];

export function runEmergencyRuleset(text: string): { isEmergency: boolean; reasons: string[]; selfHarm: boolean } {
  const reasons: string[] = [];
  let selfHarm = false;

  for (const rule of EMERGENCY_RULES) {
    if (rule.patterns.some((p) => p.test(text))) {
      reasons.push(rule.reason_ar);
      if (rule.is_self_harm) selfHarm = true;
    }
  }

  return { isEmergency: reasons.length > 0, reasons, selfHarm };
}