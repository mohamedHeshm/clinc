import { describe, expect, it } from "vitest";
import { matchSpecialty } from "../specialtyMatch";

const db = [
  { id: "1", name: "باطنة" },
  { id: "2", name: "جلدية" },
  { id: "3", name: "أنف وأذن وحنجرة" },
  { id: "4", name: "نساء وتوليد" },
];

describe("matchSpecialty", () => {
  it("matches exact names", () => expect(matchSpecialty("جلدية", db)?.id).toBe("2"));
  it("normalizes hamza/taa marbuta", () => {
    expect(matchSpecialty("انف واذن وحنجره", db)?.id).toBe("3");
    expect(matchSpecialty("باطنه", db)?.id).toBe("1");
  });
  it("matches by containment", () => expect(matchSpecialty("طبيب جلدية", db)?.id).toBe("2"));
  it("never invents a specialty that is not in the database", () => {
    expect(matchSpecialty("جراحة قلب", db)).toBeNull();
    expect(matchSpecialty("", db)).toBeNull();
  });
});