import { describe, it, expect } from "vitest";
import { getInitialDueDelayMs } from "@/lib/weakness/review-queue";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const THREE_DAYS_MS = 3 * ONE_DAY_MS;

describe("review queue initial delay", () => {
  it("drill dueAt is 1 day from enqueue", () => {
    expect(getInitialDueDelayMs("drill")).toBe(ONE_DAY_MS);
  });

  it("exam dueAt is 3 days from enqueue", () => {
    expect(getInitialDueDelayMs("exam")).toBe(THREE_DAYS_MS);
  });
});

describe("placement scheduling", () => {
  it("boosts skills below 50", () => {
    const scores = { vocab: 80, kanji: 40, grammar: 70, reading: 30, listening: 60 };
    const weak = Object.entries(scores).filter(([, s]) => s < 50).map(([k]) => k);
    expect(weak).toContain("kanji");
    expect(weak).toContain("reading");
    expect(weak).not.toContain("vocab");
  });
});
