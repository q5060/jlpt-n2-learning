import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { authOptions } from "@/lib/auth";
import { getRemoteDb } from "@/lib/db/remote/client";
import { srsCardsRemote, examResultsRemote, userSettingsRemote } from "@/lib/db/remote/schema";
import type { SyncPayload } from "@/lib/db/sync";

const memoryStore = new Map<string, SyncPayload>();

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.email;
  const remoteDb = getRemoteDb();

  if (remoteDb) {
    const [cards, exams, settings] = await Promise.all([
      remoteDb.select().from(srsCardsRemote).where(eq(srsCardsRemote.userId, userId)),
      remoteDb.select().from(examResultsRemote).where(eq(examResultsRemote.userId, userId)),
      remoteDb.select().from(userSettingsRemote).where(eq(userSettingsRemote.userId, userId)),
    ]);
    return NextResponse.json({
      srsCards: cards.map(({ userId: _, ...c }) => c),
      examResults: exams.map(({ userId: _, ...e }) => ({ ...e, answers: JSON.stringify(e.answers) })),
      settings: settings[0] ? { id: "main", data: settings[0].settings } : null,
      lastSyncAt: Date.now(),
    });
  }

  return NextResponse.json(memoryStore.get(userId) ?? { srsCards: [], examResults: [], settings: null, lastSyncAt: 0 });
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
    return NextResponse.json({ ok: true, backend: "postgres" });
  }

  memoryStore.set(userId, data);
  return NextResponse.json({ ok: true, backend: "memory" });
}
