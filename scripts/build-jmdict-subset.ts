#!/usr/bin/env npx tsx
/**
 * Builds JMdict subset from vocab list for reading lookup.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

const vocab = JSON.parse(
  readFileSync(join(process.cwd(), "content/vocab/n2.json"), "utf-8")
) as { word: string; reading: string; meaning: string }[];

const dict: Record<string, { reading: string; meaning: string }> = {};
for (const v of vocab) {
  dict[v.word] = { reading: v.reading, meaning: v.meaning };
  const key = `${v.word}|${v.reading}`;
  dict[key] = { reading: v.reading, meaning: v.meaning };
}

const outDir = join(process.cwd(), "content/dict");
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
writeFileSync(
  join(outDir, "jmdict-subset.json"),
  JSON.stringify(dict, null, 2)
);
console.log(`Wrote ${Object.keys(dict).length} dict entries`);
