import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { authOptions } from "@/lib/auth";
import { getRemoteDb } from "@/lib/db/remote/client";
import {
  srsCardsRemote,
  examResultsRemote,
  userSettingsRemote,
  wrongAnswerQueueRemote,
  customVocabRemote,
  weaknessItemsRemote,
  weaknessScoresRemote,
  studySessionsRemote,
} from "@/lib/db/remote/schema";
import type { SyncPayload } from "@/lib/db/sync";

function omitKeys<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  ...keys: K[]
): Omit<T, K> {
  const copy = { ...obj };
  for (const key of keys) {
    delete copy[key];
  }
  return copy as Omit<T, K>;
}

const memoryStore = new Map<string, SyncPayload>();

function emptyPayload(): SyncPayload {
  return {
    srsCards: [],
    examResults: [],
    settings: null,
    wrongAnswerQueue: [],
    customVocab: [],
    weaknessItems: [],
    weakness: [],
    studySessions: [],
    lastSyncAt: 0,
  };
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.email;
  const remoteDb = getRemoteDb();

  if (remoteDb) {
    const [cards, exams, settings, wrongQueue, customVocab, weaknessItems, weakness, studySessions] = await Promise.all([
      remoteDb.select().from(srsCardsRemote).where(eq(srsCardsRemote.userId, userId)),
      remoteDb.select().from(examResultsRemote).where(eq(examResultsRemote.userId, userId)),
      remoteDb.select().from(userSettingsRemote).where(eq(userSettingsRemote.userId, userId)),
      remoteDb.select().from(wrongAnswerQueueRemote).where(eq(wrongAnswerQueueRemote.userId, userId)),
      remoteDb.select().from(customVocabRemote).where(eq(customVocabRemote.userId, userId)),
      remoteDb.select().from(weaknessItemsRemote).where(eq(weaknessItemsRemote.userId, userId)),
      remoteDb.select().from(weaknessScoresRemote).where(eq(weaknessScoresRemote.userId, userId)),
      remoteDb.select().from(studySessionsRemote).where(eq(studySessionsRemote.userId, userId)),
    ]);
    return NextResponse.json({
      srsCards: cards.map((c) => omitKeys(c, "userId")),
      examResults: exams.map((e) => ({
        ...omitKeys(e, "userId"),
        answers: JSON.stringify(e.answers),
      })),
      settings: settings[0] ? { id: "main", data: settings[0].settings } : null,
      wrongAnswerQueue: wrongQueue.map((w) => {
        const row = omitKeys(w, "userId", "updatedAt");
        return {
          id: row.id,
          contentId: row.contentId,
          contentType: row.contentType,
          skill: row.skill,
          dueAt: row.dueAt,
          source: row.source,
          attempts: row.attempts,
          prompt: row.prompt ?? undefined,
          exerciseId: row.exerciseId ?? undefined,
        };
      }),
      customVocab: customVocab.map((v) => ({
        ...omitKeys(v, "userId", "updatedAt"),
        tags: (v.tags as string[]) ?? [],
      })),
      weaknessItems: weaknessItems.map((w) => omitKeys(w, "userId", "updatedAt")),
      weakness: weakness.map((w) => omitKeys(w, "userId", "updatedAt")),
      studySessions: studySessions.map((s) => {
        const row = omitKeys(s, "userId", "updatedAt");
        return {
          id: row.id,
          date: row.date,
          minutes: row.minutes,
          cardsReviewed: row.cardsReviewed,
        };
      }),
      lastSyncAt: Date.now(),
    });
  }

  return NextResponse.json(memoryStore.get(userId) ?? emptyPayload());
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.email;
  const data = (await req.json()) as SyncPayload;
  const remoteDb = getRemoteDb();

  if (remoteDb) {
    for (const card of data.srsCards) {
      await remoteDb.insert(srsCardsRemote).values({ ...card, userId }).onConflictDoUpdate({
        target: srsCardsRemote.id,
        set: { ...card, userId, updatedAt: new Date() },
      });
    }
    for (const exam of data.examResults) {
      await remoteDb.insert(examResultsRemote).values({
        ...exam,
        userId,
        answers: JSON.parse(exam.answers),
      }).onConflictDoNothing();
    }
    if (data.settings) {
      await remoteDb.insert(userSettingsRemote).values({
        userId,
        settings: data.settings.data,
      }).onConflictDoUpdate({
        target: userSettingsRemote.userId,
        set: { settings: data.settings.data, updatedAt: new Date() },
      });
    }
    for (const item of data.wrongAnswerQueue ?? []) {
      await remoteDb.insert(wrongAnswerQueueRemote).values({
        ...item,
        userId,
        contentType: item.contentType,
        prompt: item.prompt ?? null,
        exerciseId: item.exerciseId ?? null,
      }).onConflictDoUpdate({
        target: wrongAnswerQueueRemote.id,
        set: {
          ...item,
          userId,
          prompt: item.prompt ?? null,
          exerciseId: item.exerciseId ?? null,
          updatedAt: new Date(),
        },
      });
    }
    for (const vocab of data.customVocab ?? []) {
      await remoteDb.insert(customVocabRemote).values({
        ...vocab,
        userId,
        tags: vocab.tags,
      }).onConflictDoUpdate({
        target: customVocabRemote.id,
        set: { ...vocab, userId, tags: vocab.tags, updatedAt: new Date() },
      });
    }
    for (const w of data.weaknessItems ?? []) {
      await remoteDb.insert(weaknessItemsRemote).values({
        ...w,
        userId,
      }).onConflictDoUpdate({
        target: [weaknessItemsRemote.userId, weaknessItemsRemote.contentId],
        set: { ...w, userId, updatedAt: new Date() },
      });
    }
    for (const w of data.weakness ?? []) {
      await remoteDb.insert(weaknessScoresRemote).values({
        ...w,
        userId,
      }).onConflictDoUpdate({
        target: [weaknessScoresRemote.userId, weaknessScoresRemote.skill],
        set: { ...w, userId },
      });
    }
    for (const s of data.studySessions ?? []) {
      await remoteDb.insert(studySessionsRemote).values({
        ...s,
        userId,
      }).onConflictDoUpdate({
        target: [studySessionsRemote.userId, studySessionsRemote.id],
        set: { ...s, userId, updatedAt: new Date() },
      });
    }
    return NextResponse.json({ ok: true, backend: "postgres" });
  }

  memoryStore.set(userId, { ...data, lastSyncAt: Date.now() });
  return NextResponse.json({ ok: true, backend: "memory" });
}
