import { describe, it, expect } from "vitest";
import { resolveReviewItem } from "@/lib/content/review-resolver";

describe("resolveReviewItem", () => {
  it("resolves exam question by eq id", async () => {
    const item = await resolveReviewItem("eq001", "exam");
    expect(item?.kind).toBe("exam");
    if (item?.kind === "exam") {
      expect(item.question.id).toBe("eq001");
      expect(item.question.options.length).toBeGreaterThan(0);
    }
  });

  it("resolves grammar by g id", async () => {
    const item = await resolveReviewItem("g001", "grammar");
    expect(item?.kind).toBe("grammar");
    if (item?.kind === "grammar") {
      expect(item.grammarId).toBe("g001");
      expect(item.exercise).toBeDefined();
    }
  }, 15000);
});
