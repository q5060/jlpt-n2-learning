import { db, type SRSCardRecord, type ExamResultRecord, type WrongAnswerQueueRecord, type CustomVocabRecord, type WeaknessItemRecord } from "@/lib/db/local/schema";
import { mergeSrsRecords } from "@/lib/srs/fsrs";

export interface SyncPayload {
  srsCards: SRSCardRecord[];
  examResults: ExamResultRecord[];
  settings: { id: string; data: import("@/lib/types").UserSettings } | null;
  wrongAnswerQueue?: WrongAnswerQueueRecord[];
  customVocab?: CustomVocabRecord[];
  weaknessItems?: WeaknessItemRecord[];
  lastSyncAt: number;
}

export async function exportLocalData(): Promise<SyncPayload> {
  const [srsCards, examResults, settings, wrongAnswerQueue, customVocab, weaknessItems] = await Promise.all([
    db.srsCards.toArray(),
    db.examResults.toArray(),
    db.settings.get("main"),
    db.wrongAnswerQueue.toArray(),
    db.customVocab.toArray(),
    db.weaknessItems.toArray(),
  ]);

  return {
    srsCards,
    examResults,
    settings: settings ?? null,
    wrongAnswerQueue,
    customVocab,
    weaknessItems,
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
      await db.wrongAnswerQueue.put(item);
    }
  }
  if (remote.customVocab) {
    for (const v of remote.customVocab) {
      await db.customVocab.put(v);
    }
  }
  if (remote.weaknessItems) {
    for (const w of remote.weaknessItems) {
      await db.weaknessItems.put(w);
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
