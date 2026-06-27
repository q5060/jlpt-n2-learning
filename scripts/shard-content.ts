#!/usr/bin/env npx tsx
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { createHash } from "crypto";

type ShardConfig = {
  type: string;
  source: string;
  chunkSize: number;
  idField?: string;
};

const ROOT = process.cwd();
const OUT = join(ROOT, "public/content");

const CONFIGS: ShardConfig[] = [
  { type: "vocab", source: "content/vocab/n2.json", chunkSize: 100, idField: "id" },
  { type: "kanji", source: "content/kanji/n2.json", chunkSize: 50, idField: "id" },
  { type: "grammar", source: "content/grammar/n2.json", chunkSize: 25, idField: "id" },
  { type: "reading", source: "content/reading/n2.json", chunkSize: 10, idField: "id" },
  { type: "listening", source: "content/listening/n2.json", chunkSize: 20, idField: "id" },
  { type: "placement", source: "content/placement/test.json", chunkSize: 100, idField: "id" },
  { type: "exam", source: "content/exam/n2-mock.json", chunkSize: 50, idField: "id" },
];

function shardArray<T extends Record<string, unknown>>(
  type: string,
  items: T[],
  chunkSize: number,
  idField: string
) {
  const dir = join(OUT, type);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  const shards: { file: string; count: number; ids: string[] }[] = [];
  const idToShard: Record<string, string> = {};
  const wordToId: Record<string, string> = {};

  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    const idx = String(Math.floor(i / chunkSize)).padStart(2, "0");
    const file = `shard-${idx}.json`;
    writeFileSync(join(dir, file), JSON.stringify(chunk));
    shards.push({
      file,
      count: chunk.length,
      ids: chunk.map((item) => String(item[idField] ?? "")),
    });
    for (const item of chunk) {
      const id = String(item[idField] ?? "");
      if (id) idToShard[id] = file;
      if (type === "vocab" && typeof item.word === "string") {
        wordToId[item.word as string] = id;
      }
    }
  }

  return { shards, idToShard, wordToId: type === "vocab" ? wordToId : {}, total: items.length };
}

function shardDict() {
  const source = join(ROOT, "content/dict/jmdict-subset.json");
  if (!existsSync(source)) return { shards: [], idToShard: {}, total: 0 };

  const dict = JSON.parse(readFileSync(source, "utf-8")) as Record<
    string,
    { reading: string; meaning: string }
  >;
  const dir = join(OUT, "dict");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  const buckets: Record<string, Record<string, { reading: string; meaning: string }>> = {};

  for (const [key, value] of Object.entries(dict)) {
    const first = key.charAt(0);
    let bucket = "other";
    if (/[a-zA-Z]/.test(first)) bucket = first.toLowerCase();
    else if (/[\u3040-\u309f]/.test(first)) bucket = "hiragana";
    else if (/[\u30a0-\u30ff]/.test(first)) bucket = "katakana";
    else if (/[\u4e00-\u9fff]/.test(first)) bucket = "kanji";
    if (!buckets[bucket]) buckets[bucket] = {};
    buckets[bucket][key] = value;
  }

  const shards: { file: string; count: number }[] = [];
  const idToShard: Record<string, string> = {};

  for (const [bucket, entries] of Object.entries(buckets)) {
    const file = `shard-${bucket}.json`;
    writeFileSync(join(dir, file), JSON.stringify(entries));
    const count = Object.keys(entries).length;
    shards.push({ file, count });
    for (const key of Object.keys(entries)) {
      idToShard[key] = file;
    }
  }

  return { shards, idToShard, total: Object.keys(dict).length };
}

function shardGrammarMeta() {
  const source = join(ROOT, "content/grammar/n2.json");
  if (!existsSync(source)) return [];
  const items = JSON.parse(readFileSync(source, "utf-8")) as {
    id: string;
    pattern: string;
    title: string;
    week: number;
    meaning: string;
  }[];
  const meta = items.map((g) => ({
    id: g.id,
    pattern: g.pattern,
    title: g.title,
    week: g.week,
    meaning: g.meaning,
  }));
  const dir = join(OUT, "grammar");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "meta.json"), JSON.stringify(meta));
  return meta;
}

function main() {
  if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

  const meta: Record<string, unknown> = {
    version: createHash("md5")
      .update(JSON.stringify({ t: Date.now() }))
      .digest("hex")
      .slice(0, 8),
    generatedAt: new Date().toISOString(),
    types: {} as Record<string, unknown>,
  };

  for (const cfg of CONFIGS) {
    const path = join(ROOT, cfg.source);
    if (!existsSync(path)) continue;
    const items = JSON.parse(readFileSync(path, "utf-8")) as Record<string, unknown>[];
    const result = shardArray(cfg.type, items, cfg.chunkSize, cfg.idField ?? "id");
    (meta.types as Record<string, unknown>)[cfg.type] = {
      total: result.total,
      chunkSize: cfg.chunkSize,
      shards: result.shards,
      idToShard: result.idToShard,
      ...(cfg.type === "vocab" && "wordToId" in result
        ? { wordToId: (result as { wordToId: Record<string, string> }).wordToId }
        : {}),
    };
    console.log(`${cfg.type}: ${result.total} items, ${result.shards.length} shards`);
  }

  const dictResult = shardDict();
  (meta.types as Record<string, unknown>).dict = {
    total: dictResult.total,
    shards: dictResult.shards,
    idToShard: dictResult.idToShard,
  };
  console.log(`dict: ${dictResult.total} entries, ${dictResult.shards.length} shards`);

  const grammarMeta = shardGrammarMeta();
  (meta.types as Record<string, unknown>).grammarMeta = { total: grammarMeta.length };
  console.log(`grammar meta: ${grammarMeta.length} entries`);

  writeFileSync(join(OUT, "meta.json"), JSON.stringify(meta));
  console.log("Wrote public/content/meta.json");
}

main();
