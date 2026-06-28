import { describe, it, expect } from "vitest";
import { sortWeaknessItemsByCount, mergeWeaknessItems } from "@/lib/weakness/items";
import type { WeaknessItemRecord } from "@/lib/db/local/schema";

describe("sortWeaknessItemsByCount", () => {
  it("orders by wrongCount descending", () => {
    const items: WeaknessItemRecord[] = [
      { contentId: "a", skill: "vocab", wrongCount: 2, lastWrongAt: 1 },
      { contentId: "b", skill: "grammar", wrongCount: 5, lastWrongAt: 2 },
      { contentId: "c", skill: "reading", wrongCount: 3, lastWrongAt: 3 },
    ];
    const sorted = sortWeaknessItemsByCount(items);
    expect(sorted.map((i) => i.contentId)).toEqual(["b", "c", "a"]);
  });
});

describe("mergeWeaknessItems", () => {
  it("keeps higher wrongCount and lastWrongAt", () => {
    const local: WeaknessItemRecord = {
      contentId: "x",
      skill: "vocab",
      wrongCount: 5,
      lastWrongAt: 100,
    };
    const remote: WeaknessItemRecord = {
      contentId: "x",
      skill: "vocab",
      wrongCount: 3,
      lastWrongAt: 200,
    };
    const merged = mergeWeaknessItems(local, remote);
    expect(merged.wrongCount).toBe(5);
    expect(merged.lastWrongAt).toBe(200);
  });

  it("uses remote when no local", () => {
    const remote: WeaknessItemRecord = {
      contentId: "y",
      skill: "grammar",
      wrongCount: 2,
      lastWrongAt: 50,
    };
    expect(mergeWeaknessItems(undefined, remote)).toEqual(remote);
  });
});
