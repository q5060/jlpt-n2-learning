import {
  db,
  type SRSCardRecord,
  type ExamResultRecord,
  type WrongAnswerQueueRecord,
  type CustomVocabRecord,
  type WeaknessItemRecord,
  type WeaknessRecord,
} from "@/lib/db/local/schema";
import { mergeSrsRecords } from "@/lib/srs/fsrs";
import { mergeWeaknessItems } from "@/lib/weakness/items";
import {
  mergeStudySession,
  mergeWeaknessRecord,
  mergeWrongAnswerQueue,
  type StudySessionRecord,
} from "@/lib/db/sync-merge";

export interface SyncPayload {
  srsCards: SRSCardRecord[];
  examResults: ExamResultRecord[];
  settings: { id: string; data: import("@/lib/types").UserSettings } | null;
  wrongAnswerQueue?: WrongAnswerQueueRecord[];
  customVocab?: CustomVocabRecord[];
  weaknessItems?: WeaknessItemRecord[];
  weakness?: WeaknessRecord[];
  studySessions?: StudySessionRecord[];
  lastSyncAt: number;
}

export async function exportLocalData(): Promise<SyncPayload> {
  const [
    srsCards,
    examResults,
    settings,
    wrongAnswerQueue,
    customVocab,
    weaknessItems,
    weakness,
    studySessions,
  ] = await Promise.all([
    db.srsCards.toArray(),
    db.examResults.toArray(),
    db.settings.get("main"),
    db.wrongAnswerQueue.toArray(),
    db.customVocab.toArray(),
    db.weaknessItems.toArray(),
    db.weakness.toArray(),
    db.studySessions.toArray(),
  ]);

  return {
    srsCards,
    examResults,
    settings: settings ?? null,
    wrongAnswerQueue,
    customVocab,
    weaknessItems,
    weakness,
    studySessions,
    lastSyncAt: Date.now(),
  };
}

export async function importRemoteData(remote: SyncPayload): Promise<void> {
  for (const remoteCard of remote.srsCards) {
    const local = await db.srsCards.get(remoteCard.id);
    if (!local) {
      await db.srsCards.put(remoteCard);
    } else {
      await db.srsCards.put(mergeSrsRecords(local, remoteCard));
    }
  }

  for (const result of remote.examResults) {
    const existing = await db.examResults.get(result.id);
    if (!existing) {
      await db.examResults.put(result);
    }
  }

  if (remote.settings) {
    await db.settings.put(remote.settings);
  }

  if (remote.wrongAnswerQueue) {
    for (const item of remote.wrongAnswerQueue) {
      const local = await db.wrongAnswerQueue.get(item.id);
      await db.wrongAnswerQueue.put(mergeWrongAnswerQueue(local, item));
    }
  }
  if (remote.customVocab) {
    for (const v of remote.customVocab) {
      await db.customVocab.put(v);
    }
  }
  if (remote.weaknessItems) {
    for (const w of remote.weaknessItems) {
      const local = await db.weaknessItems.get(w.contentId);
      await db.weaknessItems.put(mergeWeaknessItems(local, w));
    }
  }
  if (remote.weakness) {
    for (const w of remote.weakness) {
      const local = await db.weakness.get(w.skill);
      await db.weakness.put(mergeWeaknessRecord(local, w));
    }
  }
  if (remote.studySessions) {
    for (const s of remote.studySessions) {
      const local = await db.studySessions.get(s.id);
      await db.studySessions.put(mergeStudySession(local, s));
    }
  }

  await db.syncMeta.put({
    key: "lastSyncAt",
    value: String(remote.lastSyncAt),
    updatedAt: Date.now(),
  });
}

export async function getLastSyncTime(): Promise<number | null> {
  const meta = await db.syncMeta.get("lastSyncAt");
  return meta ? Number(meta.value) : null;
}
