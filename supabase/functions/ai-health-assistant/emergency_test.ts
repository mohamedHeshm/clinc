// تشغيل: deno test supabase/functions/ai-health-assistant/emergency_test.ts
import { assert, assertEquals } from "jsr:@std/assert@1";
import { runEmergencyRuleset } from "./emergency.ts";

Deno.test("chest pain (Arabic) is an emergency", () => {
  assert(runEmergencyRuleset("عندي ألم في الصدر من ساعة").isEmergency);
});
Deno.test("breathing difficulty (English) is an emergency", () => {
  assert(runEmergencyRuleset("I have shortness of breath").isEmergency);
});
Deno.test("stroke signs (Arabic)", () => {
  assert(runEmergencyRuleset("فيه تنميل في نص الجسم وكلام غير واضح").isEmergency);
});
Deno.test("self-harm flags crisis support", () => {
  const r = runEmergencyRuleset("مش عايز أعيش");
  assert(r.isEmergency && r.selfHarm);
});
Deno.test("mild headache is not an emergency by rules", () => {
  const r = runEmergencyRuleset("عندي صداع بسيط من يومين وحاسس بتعب");
  assertEquals(r.isEmergency, false);
});
Deno.test("empty text is safe", () => {
  assertEquals(runEmergencyRuleset("").isEmergency, false);
});