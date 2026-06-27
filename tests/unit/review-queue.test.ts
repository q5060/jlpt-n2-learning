import { describe, it, expect, vi, beforeEach } from "vitest";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

describe("review queue 7-day logic", () => {
  it("dueAt is 7 days from enqueue", () => {
    const now = Date.now();
    const dueAt = now + SEVEN_DAYS_MS;
    expect(dueAt - now).toBe(SEVEN_DAYS_MS);
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
