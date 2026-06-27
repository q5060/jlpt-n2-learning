import { db } from "@/lib/db/local/schema";
import { getImportedVocab } from "@/lib/import/parsers";
import { loadVocab } from "@/lib/content/loader";
import { createCardsForContent } from "@/lib/srs/fsrs";
import type { VocabEntry } from "@/lib/types";

export async function getMergedVocabList(): Promise<VocabEntry[]> {
  const [builtIn, imported] = await Promise.all([loadVocab(), getImportedVocab()]);
  const seen = new Set<string>();
  const merged: VocabEntry[] = [];
  for (const v of [...builtIn, ...imported]) {
    if (seen.has(v.word)) continue;
    seen.add(v.word);
    merged.push(v);
  }
  return merged;
}

export async function getImportedNotInSrsCount(): Promise<number> {
  const imported = await getImportedVocab();
  const existing = await db.srsCards.where("cardType").equals("vocab").toArray();
  const existingIds = new Set(existing.map((c) => c.contentId));
  return imported.filter((v) => !existingIds.has(v.id)).length;
}

export async function addImportedToSrs(): Promise<number> {
  const imported = await getImportedVocab();
  const existing = await db.srsCards.where("cardType").equals("vocab").toArray();
  const existingIds = new Set(existing.map((c) => c.contentId));
  let count = 0;
  for (const v of imported) {
    if (existingIds.has(v.id)) continue;
    await createCardsForContent(v.id, "vocab", ["recognition"]);
    count++;
  }
  return count;
}
