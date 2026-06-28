import { describe, it, expect, vi, beforeEach } from "vitest";

const putMock = vi.fn();
const getMock = vi.fn();

vi.mock("@/lib/db/local/schema", () => ({
  db: {
    studySessions: {
      get: (...args: unknown[]) => getMock(...args),
      put: (...args: unknown[]) => putMock(...args),
    },
  },
}));

describe("logStudyMinutes", () => {
  beforeEach(() => {
    putMock.mockReset();
    getMock.mockReset();
  });

  it("creates a new session when none exists", async () => {
    getMock.mockResolvedValue(undefined);
    const { logStudyMinutes } = await import("@/lib/study/session-log");
    await logStudyMinutes(5, 2);
    expect(putMock).toHaveBeenCalledWith(
      expect.objectContaining({ minutes: 5, cardsReviewed: 2 })
    );
  });

  it("accumulates minutes and cards on existing session", async () => {
    getMock.mockResolvedValue({
      id: "2026-01-01",
      date: "2026-01-01",
      minutes: 10,
      cardsReviewed: 3,
    });
    const { logStudyMinutes } = await import("@/lib/study/session-log");
    await logStudyMinutes(5, 1);
    expect(putMock).toHaveBeenCalledWith(
      expect.objectContaining({ minutes: 15, cardsReviewed: 4 })
    );
  });
});
