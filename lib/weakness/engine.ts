import { db } from "@/lib/db/local/schema";
import { incrementWeaknessItem } from "@/lib/weakness/items";
import type { SkillTag } from "@/lib/types";

const EXAM_WEIGHTS: Record<SkillTag, number> = {
  vocab: 0.165,
  kanji: 0.055,
  grammar: 0.11,
  reading: 0.33,
  listening: 0.34,
};

const EWMA_ALPHA = 0.3;

export async function recordAttempt(
  skill: SkillTag,
  correct: boolean,
  contentId?: string
): Promise<void> {
  const existing = await db.weakness.get(skill);
  const base = existing ?? {
    skill,
    score: 0.5,
    totalAttempts: 0,
    correctAttempts: 0,
    updatedAt: Date.now(),
  };

  const attemptScore = correct ? 1 : 0;
  const newScore = EWMA_ALPHA * attemptScore + (1 - EWMA_ALPHA) * base.score;

  await db.weakness.put({
    skill,
    score: 1 - newScore,
    totalAttempts: base.totalAttempts + 1,
    correctAttempts: base.correctAttempts + (correct ? 1 : 0),
    updatedAt: Date.now(),
  });

  if (!correct && contentId) {
    await incrementWeaknessItem(contentId, skill);
    await db.progress.put({
      id: `weakness-${skill}-${contentId}`,
      contentType:
        skill === "kanji"
          ? "kanji"
          : skill === "vocab"
            ? "vocab"
            : skill === "grammar"
              ? "grammar"
              : skill === "reading"
                ? "reading"
                : "listening",
      contentId,
      completed: false,
      score: 0,
    });
  }
}

export async function getWeaknessScores(): Promise<
  Record<SkillTag, number>
> {
  const records = await db.weakness.toArray();
  const result: Record<SkillTag, number> = {
    vocab: 0.5,
    kanji: 0.5,
    grammar: 0.5,
    reading: 0.5,
    listening: 0.5,
  };
  for (const r of records) {
    result[r.skill] = r.score;
  }
  return result;
}

export function computePriority(
  weaknessScore: number,
  overdueFactor: number,
  skill: SkillTag
): number {
  return weaknessScore * overdueFactor * EXAM_WEIGHTS[skill] * 10;
}

export async function getWeakestSkill(): Promise<SkillTag> {
  const scores = await getWeaknessScores();
  return (Object.entries(scores).sort((a, b) => b[1] - a[1])[0]?.[0] ??
    "vocab") as SkillTag;
}

export function estimatePassProbability(
  languageScore: number,
  readingScore: number,
  listeningScore: number,
  history: { totalScore: number }[]
): number {
  const total = languageScore + readingScore + listeningScore;
  const passLine = 90;
  const sectionPass = {
    language: languageScore >= 19,
    reading: readingScore >= 19,
    listening: listeningScore >= 19,
  };

  if (!sectionPass.language || !sectionPass.reading || !sectionPass.listening) {
    return Math.min(0.4, total / 180);
  }

  if (total >= passLine) {
    const margin = total - passLine;
    const historyAvg =
      history.length > 0
        ? history.reduce((s, h) => s + h.totalScore, 0) / history.length
        : total;
    const trend = total >= historyAvg ? 0.1 : -0.05;
    return Math.min(0.95, 0.7 + margin / 60 + trend);
  }

  return Math.max(0.1, (total / passLine) * 0.6);
}

export const SKILL_LABELS: Record<SkillTag, string> = {
  vocab: "語彙",
  kanji: "漢字",
  grammar: "文法",
  reading: "読解",
  listening: "聴解",
};
