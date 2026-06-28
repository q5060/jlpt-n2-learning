import type {
  WeaknessRecord,
  WrongAnswerQueueRecord,
} from "@/lib/db/local/schema";

export type StudySessionRecord = {
  id: string;
  date: string;
  minutes: number;
  cardsReviewed: number;
};

export function mergeWrongAnswerQueue(
  local: WrongAnswerQueueRecord | undefined,
  remote: WrongAnswerQueueRecord
): WrongAnswerQueueRecord {
  if (!local) return remote;
  return {
    ...remote,
    dueAt: Math.min(local.dueAt, remote.dueAt),
    attempts: Math.max(local.attempts, remote.attempts),
  };
}

export function mergeWeaknessRecord(
  local: WeaknessRecord | undefined,
  remote: WeaknessRecord
): WeaknessRecord {
  if (!local) return remote;
  return local.updatedAt >= remote.updatedAt ? local : remote;
}

export function mergeStudySession(
  local: StudySessionRecord | undefined,
  remote: StudySessionRecord
): StudySessionRecord {
  if (!local) return remote;
  return {
    ...remote,
    minutes: Math.max(local.minutes, remote.minutes),
    cardsReviewed: Math.max(local.cardsReviewed, remote.cardsReviewed),
  };
}
