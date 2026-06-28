import { db, type WeaknessItemRecord } from "@/lib/db/local/schema";
import type { SkillTag } from "@/lib/types";

export function sortWeaknessItemsByCount(
  items: WeaknessItemRecord[]
): WeaknessItemRecord[] {
  return [...items].sort((a, b) => b.wrongCount - a.wrongCount);
}

export function mergeWeaknessItems(
  local: WeaknessItemRecord | undefined,
  remote: WeaknessItemRecord
): WeaknessItemRecord {
  if (!local) return remote;
  return {
    contentId: remote.contentId,
    skill: remote.skill,
    wrongCount: Math.max(local.wrongCount, remote.wrongCount),
    lastWrongAt: Math.max(local.lastWrongAt, remote.lastWrongAt),
  };
}

export async function incrementWeaknessItem(
  contentId: string,
  skill: SkillTag
): Promise<void> {
  const existing = await db.weaknessItems.get(contentId);
  await db.weaknessItems.put({
    contentId,
    skill,
    wrongCount: (existing?.wrongCount ?? 0) + 1,
    lastWrongAt: Date.now(),
  });
}

export async function getTopWeaknessItems(limit = 40): Promise<WeaknessItemRecord[]> {
  try {
    return await db.weaknessItems.orderBy("wrongCount").reverse().limit(limit).toArray();
  } catch {
    const all = await db.weaknessItems.toArray();
    return sortWeaknessItemsByCount(all).slice(0, limit);
  }
}
