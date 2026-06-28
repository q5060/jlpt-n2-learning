import { describe, it, expect } from "vitest";
import {
  mergeStudySession,
  mergeWeaknessRecord,
  mergeWrongAnswerQueue,
} from "@/lib/db/sync-merge";

describe("sync merge helpers", () => {
  it("mergeWrongAnswerQueue picks earlier dueAt and higher attempts", () => {
    const merged = mergeWrongAnswerQueue(
      {
        id: "a",
        contentId: "c1",
        contentType: "reading",
        skill: "reading",
        dueAt: 2000,
        source: "drill",
        attempts: 2,
      },
      {
        id: "a",
        contentId: "c1",
        contentType: "reading",
        skill: "reading",
        dueAt: 1000,
        source: "drill",
        attempts: 1,
      }
    );
    expect(merged.dueAt).toBe(1000);
    expect(merged.attempts).toBe(2);
  });

  it("mergeWeaknessRecord keeps newer updatedAt", () => {
    const merged = mergeWeaknessRecord(
      { skill: "vocab", score: 0.5, totalAttempts: 10, correctAttempts: 5, updatedAt: 200 },
      { skill: "vocab", score: 0.8, totalAttempts: 20, correctAttempts: 8, updatedAt: 100 }
    );
    expect(merged.updatedAt).toBe(200);
  });

  it("mergeStudySession accumulates minutes and cards", () => {
    const merged = mergeStudySession(
      { id: "2026-01-01", date: "2026-01-01", minutes: 10, cardsReviewed: 3 },
      { id: "2026-01-01", date: "2026-01-01", minutes: 5, cardsReviewed: 7 }
    );
    expect(merged.minutes).toBe(10);
    expect(merged.cardsReviewed).toBe(7);
  });
});
