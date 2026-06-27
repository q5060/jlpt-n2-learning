import { describe, it, expect } from "vitest";
import { getImportedNotInSrsCount, addImportedToSrs } from "@/lib/import/merge";

describe("import merge", () => {
  it("exports SRS import helpers", () => {
    expect(typeof getImportedNotInSrsCount).toBe("function");
    expect(typeof addImportedToSrs).toBe("function");
  });
});
