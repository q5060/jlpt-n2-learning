import {
  createEmptyCard,
  fsrs,
  generatorParameters,
  Rating,
  type Card,
  type Grade,
  type RecordLogItem,
} from "ts-fsrs";
import { db, type SRSCardRecord, logReview } from "@/lib/db/local/schema";
import type { CardType, SkillTag } from "@/lib/types";
import { getSettings } from "@/lib/db/local/schema";

const params = generatorParameters({ enable_fuzz: true });
const f = fsrs(params);

export function ratingFromButton(button: 1 | 2 | 3 | 4): Grade {
  const map = {
    1: Rating.Again,
    2: Rating.Hard,
    3: Rating.Good,
    4: Rating.Easy,
  } as const;
  return map[button];
}

export function recordToFsrsCard(record: SRSCardRecord): Card {
  return {
    due: new Date(record.due),
    stability: record.stability,
    difficulty: record.difficulty,
    elapsed_days: record.elapsedDays,
    scheduled_days: record.scheduledDays,
    learning_steps: record.learningSteps,
    reps: record.reps,
    lapses: record.lapses,
    state: record.state,
    last_review: record.lastReview ? new Date(record.lastReview) : undefined,
  };
}

export function fsrsCardToRecord(
  card: Card,
  base: Pick<SRSCardRecord, "id" | "contentId" | "cardType" | "reviewMode">
): SRSCardRecord {
  return {
    ...base,
    due: card.due.getTime(),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsedDays: card.elapsed_days,
    scheduledDays: card.scheduled_days,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state,
    learningSteps: card.learning_steps,
    lastReview: card.last_review?.getTime(),
  };
}

export async function getOrCreateCard(
  contentId: string,
  cardType: CardType,
  reviewMode = "recognition"
): Promise<SRSCardRecord> {
  const id = `${cardType}-${contentId}-${reviewMode}`;
  const existing = await db.srsCards.get(id);
  if (existing) return existing;

  const empty = createEmptyCard();
  const record = fsrsCardToRecord(empty, {
    id,
    contentId,
    cardType,
    reviewMode,
  });
  await db.srsCards.add(record);
  return record;
}

export const LEECH_LAPSE_THRESHOLD = 8;

export async function getLeechCards(): Promise<SRSCardRecord[]> {
  const cards = await db.srsCards.toArray();
  return cards.filter((c) => c.lapses >= LEECH_LAPSE_THRESHOLD);
}

export async function reviewCard(
  cardId: string,
  rating: Grade,
  skill: SkillTag = "vocab"
): Promise<SRSCardRecord> {
  const record = await db.srsCards.get(cardId);
  if (!record) throw new Error("Card not found");

  const card = recordToFsrsCard(record);
  const now = new Date();
  const result: RecordLogItem = f.next(card, now, rating);
  const updated = fsrsCardToRecord(result.card, {
    id: record.id,
    contentId: record.contentId,
    cardType: record.cardType,
    reviewMode: record.reviewMode,
  });

  if (updated.lapses >= LEECH_LAPSE_THRESHOLD) {
    updated.due = now.getTime() + 365 * 24 * 60 * 60 * 1000;
  }

  await db.srsCards.put(updated);
  await logReview(cardId, rating, skill);
  return updated;
}

export const REVIEW_MODES = ["recognition", "recall", "cloze", "listening"] as const;

export async function createCardsForContent(
  contentId: string,
  cardType: CardType,
  modes: readonly string[] = ["recognition"]
): Promise<SRSCardRecord[]> {
  return Promise.all(modes.map((m) => getOrCreateCard(contentId, cardType, m)));
}

export async function getDueCards(limit?: number): Promise<SRSCardRecord[]> {
  const settings = await getSettings();
  const cap = limit ?? settings.reviewCardsPerDay;
  const now = Date.now();
  return db.srsCards
    .where("due")
    .belowOrEqual(now)
    .limit(cap)
    .toArray();
}

export async function getDueCount(): Promise<number> {
  const now = Date.now();
  return db.srsCards.where("due").belowOrEqual(now).count();
}

export async function getNewCards(
  cardType: CardType,
  contentIds: string[],
  limit: number
): Promise<string[]> {
  const existing = await db.srsCards
    .where("cardType")
    .equals(cardType)
    .toArray();
  const existingIds = new Set(existing.map((c) => c.contentId));
  return contentIds.filter((id) => !existingIds.has(id)).slice(0, limit);
}

export function mergeSrsRecords(
  local: SRSCardRecord,
  remote: SRSCardRecord
): SRSCardRecord {
  if (remote.due > local.due) return remote;
  if (remote.due < local.due) return local;
  return remote.reps >= local.reps ? remote : local;
}
