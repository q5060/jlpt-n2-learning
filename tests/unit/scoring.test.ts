import { describe, it, expect } from "vitest";
import { scoreExam, PASS_LINE } from "@/lib/exam/scoring";
import { estimatePassProbability, computePriority } from "@/lib/weakness/engine";
import { mergeSrsRecords } from "@/lib/srs/fsrs";
import type { ExamQuestion } from "@/lib/types";
import type { SRSCardRecord } from "@/lib/db/local/schema";

const sampleQuestions: ExamQuestion[] = [
  {
    id: "q1",
    section: "language",
    skill: "vocab",
    prompt: "test",
    options: ["a", "b", "c", "d"],
    correctIndex: 0,
    explanation: "",
  },
  {
    id: "q2",
    section: "reading",
    skill: "reading",
    prompt: "test",
    options: ["a", "b", "c", "d"],
    correctIndex: 1,
    explanation: "",
  },
  {
    id: "q3",
    section: "listening",
    skill: "listening",
    prompt: "test",
    options: ["a", "b", "c", "d"],
    correctIndex: 2,
    explanation: "",
  },
];

describe("scoreExam", () => {
  it("scores correct answers", () => {
    const result = scoreExam(sampleQuestions, { q1: 0, q2: 1, q3: 2 });
    expect(result.totalScore).toBeGreaterThan(0);
    expect(result.languageScore).toBe(PASS_LINE.maxSection);
  });

  it("handles wrong answers", () => {
    const result = scoreExam(sampleQuestions, { q1: 1, q2: 0, q3: 0 });
    expect(result.passed).toBe(false);
  });
});

describe("estimatePassProbability", () => {
  it("returns higher probability when passing", () => {
    const high = estimatePassProbability(30, 30, 30, []);
    const low = estimatePassProbability(10, 10, 10, []);
    expect(high).toBeGreaterThan(low);
  });
});

describe("computePriority", () => {
  it("weights by exam section", () => {
    const listening = computePriority(0.8, 1, "listening");
    const kanji = computePriority(0.8, 1, "kanji");
    expect(listening).toBeGreaterThan(kanji);
  });
});

describe("mergeSrsRecords", () => {
  it("prefers later due date", () => {
    const base: SRSCardRecord = {
      id: "1",
      contentId: "v1",
      cardType: "vocab",
      due: 1000,
      stability: 1,
      difficulty: 5,
      elapsedDays: 0,
      scheduledDays: 1,
      reps: 1,
      lapses: 0,
      state: 1,
      learningSteps: 0,
      reviewMode: "recognition",
    };
    const remote = { ...base, due: 2000, reps: 2 };
    expect(mergeSrsRecords(base, remote).due).toBe(2000);
  });
});
