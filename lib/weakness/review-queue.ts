import { db, type WrongAnswerQueueRecord } from "@/lib/db/local/schema";
import { incrementWeaknessItem } from "@/lib/weakness/items";
import type { SkillTag } from "@/lib/types";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const THREE_DAYS_MS = 3 * ONE_DAY_MS;
const FOURTEEN_DAYS_MS = 14 * ONE_DAY_MS;

export function getInitialDueDelayMs(source: "exam" | "drill"): number {
  return source === "drill" ? ONE_DAY_MS : THREE_DAYS_MS;
}

export async function enqueueWrongAnswer(
  contentId: string,
  skill: SkillTag,
  contentType: WrongAnswerQueueRecord["contentType"],
  source: "exam" | "drill" = "exam",
  prompt?: string,
  exerciseId?: string
): Promise<void> {
  const id = `${source}-${contentType}-${contentId}${exerciseId ? `-${exerciseId}` : ""}`;
  const existing = await db.wrongAnswerQueue.get(id);
  await db.wrongAnswerQueue.put({
    id,
    contentId,
    contentType,
    skill,
    dueAt: Date.now() + getInitialDueDelayMs(source),
    source,
    attempts: (existing?.attempts ?? 0) + 1,
    prompt,
    exerciseId,
  });

  await incrementWeaknessItem(contentId, skill);
}

export async function getDueReviews(): Promise<WrongAnswerQueueRecord[]> {
  const now = Date.now();
  return db.wrongAnswerQueue.where("dueAt").belowOrEqual(now).toArray();
}

export async function getDueReviewCount(): Promise<number> {
  const now = Date.now();
  return db.wrongAnswerQueue.where("dueAt").belowOrEqual(now).count();
}

export async function completeReview(id: string, passed: boolean): Promise<void> {
  const item = await db.wrongAnswerQueue.get(id);
  if (!item) return;

  if (passed) {
    if (item.attempts >= 3) {
      await db.wrongAnswerQueue.delete(id);
      return;
    }
    await db.wrongAnswerQueue.put({
      ...item,
      dueAt: Date.now() + FOURTEEN_DAYS_MS,
    });
    return;
  }

  const retryDays = item.attempts >= 3 ? 1 : item.attempts >= 2 ? 2 : 3;
  await db.wrongAnswerQueue.put({
    ...item,
    dueAt: Date.now() + retryDays * ONE_DAY_MS,
    attempts: item.attempts + 1,
  });
}
