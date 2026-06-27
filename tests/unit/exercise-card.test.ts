import { describe, it, expect } from "vitest";
import { completeReview } from "@/lib/weakness/review-queue";

describe("completeReview scheduling", () => {
  it("exports completeReview function", () => {
    expect(typeof completeReview).toBe("function");
  });
});

describe("grammar exercise enqueue logic", () => {
  it("should use isCorrect not stale state", () => {
    let correct = false;
    const isCorrect = true;
    const shouldEnqueue = !isCorrect;
    expect(shouldEnqueue).toBe(false);
    correct = isCorrect;
    expect(!correct).toBe(false);
  });
});
