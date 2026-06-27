#!/usr/bin/env npx tsx
import { readdirSync, readFileSync, existsSync } from "fs";
import { join } from "path";
import { gzipSync } from "zlib";

const MAX_GZIP_KB = 250;
const NEXT_DIR = join(process.cwd(), ".next/static/chunks");

function findLargestChunks(): { name: string; gzipKb: number }[] {
  if (!existsSync(NEXT_DIR)) {
    console.warn("No .next build found — run npm run build first");
    return [];
  }
  const files = readdirSync(NEXT_DIR).filter((f) => f.endsWith(".js"));
  return files
    .map((name) => {
      const buf = readFileSync(join(NEXT_DIR, name));
      const gzipKb = gzipSync(buf).length / 1024;
      return { name, gzipKb };
    })
    .sort((a, b) => b.gzipKb - a.gzipKb)
    .slice(0, 10);
}

function checkContentShards() {
  const metaPath = join(process.cwd(), "public/content/meta.json");
  if (!existsSync(metaPath)) {
    console.error("Missing public/content/meta.json — run npm run content:shard");
    process.exit(1);
  }
  const meta = JSON.parse(readFileSync(metaPath, "utf-8"));
  const vocabShards = meta.types?.vocab?.shards?.length ?? 0;
  if (vocabShards < 1) {
    console.error("No vocab shards");
    process.exit(1);
  }
  console.log(`Content shards OK (vocab: ${vocabShards} shards)`);
}

function main() {
  checkContentShards();
  const top = findLargestChunks();
  if (top.length === 0) return;

  console.log("Top JS chunks (gzip KB):");
  for (const c of top) {
    console.log(`  ${c.gzipKb.toFixed(1)} KB — ${c.name}`);
  }

  const largest = top[0].gzipKb;
  if (largest > MAX_GZIP_KB) {
    console.warn(`Warning: largest chunk ${largest.toFixed(1)}KB exceeds ${MAX_GZIP_KB}KB budget`);
  } else {
    console.log(`Bundle budget OK (largest ${largest.toFixed(1)}KB < ${MAX_GZIP_KB}KB)`);
  }
}

main();
