export type QuestionType =
  | "single_choice"
  | "multi_choice"
  | "severity_scale"
  | "duration"
  | "yes_no"
  | "free_text";

export interface StructuredQuestion {
  id: string;
  type: QuestionType;
  prompt: string;
  options?: string[];
}

export interface SymptomSummary {
  symptoms?: string[];
  duration?: string | null;
  severity?: string | null;
  context?: string | null;
}

export type ConfidenceLabel = "high" | "medium" | "low";

export interface RecommendedSpecialty {
  name: string;
  confidence_label: ConfidenceLabel;
  reason: string;
}

export type AssessmentStage = "collecting" | "ready_for_summary" | "recommendations";

export interface AssistantResponse {
  sessionId: string;
  reply_text: string | null;
  stage: AssessmentStage;
  follow_up_questions: StructuredQuestion[];
  symptom_summary: SymptomSummary;
  is_emergency: boolean;
  is_self_harm_related: boolean;
  emergency_reasons: string[];
  recommended_specialties: RecommendedSpecialty[];
  ai_error: string | null;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}