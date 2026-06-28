#!/usr/bin/env npx tsx
import { readFileSync } from "fs";
import { join } from "path";

const THRESHOLD = Number(process.env.QUALITY_THRESHOLD ?? 0.4);

const vocab = JSON.parse(
  readFileSync(join(process.cwd(), "content/vocab/n2.json"), "utf-8")
) as { meaning: string }[];

function isFullyJapanese(text: string): boolean {
  return (
    /[\u3040-\u30ff\u4e00-\u9fff]/.test(text) &&
    !/[a-zA-Z]/.test(text) &&
    !text.includes("という意味")
  );
}

const jaCount = vocab.filter((v) => isFullyJapanese(v.meaning)).length;
const ratio = jaCount / Math.max(vocab.length, 1);

console.log(`Vocab entries: ${vocab.length}`);
console.log(`Fully Japanese meanings: ${jaCount} (${Math.round(ratio * 100)}%)`);

if (ratio < THRESHOLD) {
  console.error(`Quality below threshold ${Math.round(THRESHOLD * 100)}%`);
  process.exit(1);
}
console.log("Content quality check passed");
