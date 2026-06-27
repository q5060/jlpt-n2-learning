import { db } from "@/lib/db/local/schema";
import type {
  VocabEntry,
  KanjiEntry,
  GrammarPoint,
  ReadingPassage,
  ListeningItem,
  PlacementQuestion,
  ExamQuestion,
} from "@/lib/types";

export type GrammarMeta = {
  id: string;
  pattern: string;
  title: string;
  week: number;
  meaning: string;
};

type ContentMeta = {
  version: string;
  types: Record<
    string,
    {
      total: number;
      chunkSize?: number;
      shards: { file: string; count: number; ids?: string[] }[];
      idToShard: Record<string, string>;
    }
  >;
};

const memoryCache = new Map<string, unknown>();
const LRU_MAX = 6;

let metaCache: ContentMeta | null = null;

async function fetchMeta(): Promise<ContentMeta> {
  if (metaCache) return metaCache;
  try {
    const res = await fetch("/content/meta.json");
    if (res.ok) {
      metaCache = (await res.json()) as ContentMeta;
      return metaCache;
    }
  } catch {
    /* fallback */
  }
  metaCache = { version: "bundled", types: {} };
  return metaCache;
}

function lruSet(key: string, value: unknown) {
  if (memoryCache.size >= LRU_MAX) {
    const first = memoryCache.keys().next().value;
    if (first) memoryCache.delete(first);
  }
  memoryCache.set(key, value);
}

async function loadShard<T>(type: string, file: string): Promise<T> {
  const key = `${type}:${file}`;
  if (memoryCache.has(key)) return memoryCache.get(key) as T;

  const stored = await db.contentShards.get(key);
  if (stored) {
    const data = JSON.parse(stored.data) as T;
    lruSet(key, data);
    return data;
  }

  const res = await fetch(`/content/${type}/${file}`);
  if (!res.ok) throw new Error(`Shard not found: ${type}/${file}`);
  const data = (await res.json()) as T;
  await db.contentShards.put({ id: key, type, file, data: JSON.stringify(data), fetchedAt: Date.now() });
  lruSet(key, data);
  return data;
}

async function loadShardById<T extends { id: string }>(
  type: string,
  id: string
): Promise<T | undefined> {
  const meta = await fetchMeta();
  const typeMeta = meta.types[type];
  if (!typeMeta?.idToShard) return undefined;
  const file = typeMeta.idToShard[id];
  if (!file) return undefined;
  const shard = await loadShard<T[]>(type, file);
  return shard.find((item) => item.id === id);
}

async function loadAllFromShards<T>(type: string): Promise<T[]> {
  const meta = await fetchMeta();
  const typeMeta = meta.types[type];
  if (!typeMeta?.shards?.length) return loadBundled<T[]>(type);
  const results: T[] = [];
  for (const s of typeMeta.shards) {
    const chunk = await loadShard<T[]>(type, s.file);
    results.push(...chunk);
  }
  return results;
}

async function loadBundled<T>(type: string): Promise<T> {
  switch (type) {
    case "vocab":
      return (await import("@/content/vocab/n2.json")).default as T;
    case "kanji":
      return (await import("@/content/kanji/n2.json")).default as T;
    case "grammar":
      return (await import("@/content/grammar/n2.json")).default as T;
    case "reading":
      return (await import("@/content/reading/n2.json")).default as T;
    case "listening":
      return (await import("@/content/listening/n2.json")).default as T;
    case "placement":
      return (await import("@/content/placement/test.json")).default as T;
    case "exam":
      return (await import("@/content/exam/n2-mock.json")).default as T;
    default:
      throw new Error(`Unknown type: ${type}`);
  }
}

export async function getVocabSlice(offset: number, limit: number): Promise<VocabEntry[]> {
  const meta = await fetchMeta();
  const typeMeta = meta.types.vocab;
  if (!typeMeta?.shards?.length) {
    const all = await loadBundled<VocabEntry[]>("vocab");
    return all.slice(offset, offset + limit);
  }
  const results: VocabEntry[] = [];
  let skip = offset;
  for (const s of typeMeta.shards) {
    if (results.length >= limit) break;
    const shard = await loadShard<VocabEntry[]>("vocab", s.file);
    if (skip >= shard.length) {
      skip -= shard.length;
      continue;
    }
    const take = shard.slice(skip, skip + (limit - results.length));
    results.push(...take);
    skip = 0;
  }
  return results;
}

export async function getVocabCount(): Promise<number> {
  const meta = await fetchMeta();
  return meta.types.vocab?.total ?? (await loadBundled<VocabEntry[]>("vocab")).length;
}

export async function getVocabByWord(word: string): Promise<VocabEntry | undefined> {
  const meta = await fetchMeta();
  const vocabMeta = meta.types.vocab as { wordToId?: Record<string, string> } | undefined;
  const id = vocabMeta?.wordToId?.[word];
  if (id) return getVocabById(id);
  const all = await loadBundled<VocabEntry[]>("vocab");
  return all.find((v) => v.word === word);
}

export async function getVocabById(id: string): Promise<VocabEntry | undefined> {
  const item = await loadShardById<VocabEntry>("vocab", id);
  if (item) return item;
  const all = await loadBundled<VocabEntry[]>("vocab");
  return all.find((v) => v.id === id);
}

export async function getVocabByIds(ids: string[]): Promise<VocabEntry[]> {
  const results = await Promise.all(ids.map((id) => getVocabById(id)));
  return results.filter(Boolean) as VocabEntry[];
}

export async function loadVocab(): Promise<VocabEntry[]> {
  return loadAllFromShards<VocabEntry>("vocab");
}

export async function getKanjiSlice(offset: number, limit: number): Promise<KanjiEntry[]> {
  const meta = await fetchMeta();
  const typeMeta = meta.types.kanji;
  if (!typeMeta?.shards?.length) {
    const all = await loadBundled<KanjiEntry[]>("kanji");
    return all.slice(offset, offset + limit);
  }
  const results: KanjiEntry[] = [];
  let skip = offset;
  for (const s of typeMeta.shards) {
    if (results.length >= limit) break;
    const shard = await loadShard<KanjiEntry[]>("kanji", s.file);
    if (skip >= shard.length) {
      skip -= shard.length;
      continue;
    }
    results.push(...shard.slice(skip, skip + (limit - results.length)));
    skip = 0;
  }
  return results;
}

export async function getKanjiCount(): Promise<number> {
  const meta = await fetchMeta();
  return meta.types.kanji?.total ?? (await loadBundled<KanjiEntry[]>("kanji")).length;
}

export async function getKanjiById(id: string): Promise<KanjiEntry | undefined> {
  const item = await loadShardById<KanjiEntry>("kanji", id);
  if (item) return item;
  const all = await loadBundled<KanjiEntry[]>("kanji");
  return all.find((k) => k.id === id);
}

export async function getKanjiByIds(ids: string[]): Promise<KanjiEntry[]> {
  const results = await Promise.all(ids.map((id) => getKanjiById(id)));
  return results.filter(Boolean) as KanjiEntry[];
}

export async function loadKanji(): Promise<KanjiEntry[]> {
  return loadAllFromShards<KanjiEntry>("kanji");
}

export async function getGrammarListMeta(): Promise<GrammarMeta[]> {
  try {
    const res = await fetch("/content/grammar/meta.json");
    if (res.ok) return (await res.json()) as GrammarMeta[];
  } catch {
    /* fallback */
  }
  const all = await loadAllFromShards<GrammarPoint>("grammar");
  return all.map((g) => ({
    id: g.id,
    pattern: g.pattern,
    title: g.title,
    week: g.week,
    meaning: g.meaning,
  }));
}

export async function getGrammarById(id: string): Promise<GrammarPoint | undefined> {
  const item = await loadShardById<GrammarPoint>("grammar", id);
  if (item) return item;
  const all = await loadBundled<GrammarPoint[]>("grammar");
  return all.find((g) => g.id === id);
}

export async function loadGrammar(): Promise<GrammarPoint[]> {
  return loadAllFromShards<GrammarPoint>("grammar");
}

export async function getReadingMeta(): Promise<
  Pick<ReadingPassage, "id" | "title" | "level" | "timeLimitMinutes">[]
> {
  const all = await loadAllFromShards<ReadingPassage>("reading");
  return all.map((r) => ({
    id: r.id,
    title: r.title,
    level: r.level,
    timeLimitMinutes: r.timeLimitMinutes,
  }));
}

export async function getReadingById(id: string): Promise<ReadingPassage | undefined> {
  const item = await loadShardById<ReadingPassage>("reading", id);
  if (item) return item;
  const all = await loadBundled<ReadingPassage[]>("reading");
  return all.find((r) => r.id === id);
}

export async function loadReading(): Promise<ReadingPassage[]> {
  return loadAllFromShards<ReadingPassage>("reading");
}

export async function getListeningMeta(): Promise<
  Pick<ListeningItem, "id" | "title" | "type" | "audioUrl">[]
> {
  const all = await loadAllFromShards<ListeningItem>("listening");
  return all.map((l) => ({
    id: l.id,
    title: l.title,
    type: l.type,
    audioUrl: l.audioUrl,
  }));
}

export async function getListeningById(id: string): Promise<ListeningItem | undefined> {
  const item = await loadShardById<ListeningItem>("listening", id);
  if (item) return item;
  const all = await loadBundled<ListeningItem[]>("listening");
  return all.find((l) => l.id === id);
}

export async function loadListening(): Promise<ListeningItem[]> {
  return loadAllFromShards<ListeningItem>("listening");
}

export async function loadPlacement(): Promise<PlacementQuestion[]> {
  return loadAllFromShards<PlacementQuestion>("placement");
}

export async function loadExam(): Promise<ExamQuestion[]> {
  return loadAllFromShards<ExamQuestion>("exam");
}

export async function getExamById(id: string): Promise<ExamQuestion | undefined> {
  const item = await loadShardById<ExamQuestion>("exam", id);
  if (item) return item;
  const all = await loadBundled<ExamQuestion[]>("exam");
  return all.find((e) => e.id === id);
}

export async function loadConfusionPairs(): Promise<
  { a: string; b: string; difference: string }[]
> {
  const mod = await import("@/content/grammar/confusion-pairs.json");
  return mod.default as { a: string; b: string; difference: string }[];
}

export async function lookupDict(
  word: string
): Promise<{ reading: string; meaning: string } | null> {
  const meta = await fetchMeta();
  const dictMeta = meta.types.dict;
  if (!dictMeta?.idToShard) {
    const mod = await import("@/content/dict/jmdict-subset.json");
    const dict = mod.default as Record<string, { reading: string; meaning: string }>;
    if (dict[word]) return dict[word];
    for (let len = Math.min(word.length, 6); len >= 1; len--) {
      const sub = word.slice(0, len);
      if (dict[sub]) return dict[sub];
    }
    return null;
  }

  const tryKeys = [word];
  for (let len = Math.min(word.length, 6); len >= 1; len--) {
    tryKeys.push(word.slice(0, len));
  }

  for (const key of tryKeys) {
    const file = dictMeta.idToShard[key];
    if (!file) continue;
    const shard = await loadShard<Record<string, { reading: string; meaning: string }>>(
      "dict",
      file
    );
    if (shard[key]) return shard[key];
  }
  return null;
}

export function clearContentMemoryCache() {
  memoryCache.clear();
  metaCache = null;
}
