#!/usr/bin/env npx tsx
import { readFileSync } from "fs";
import { join } from "path";

const MEANING_THRESHOLD = Number(process.env.QUALITY_THRESHOLD ?? 0.4);
const EXAMPLE_THRESHOLD = Number(process.env.EXAMPLE_THRESHOLD ?? 0.3);

const TEMPLATE_PHRASES = [
  "は日常会話でよく使われる。",
  "について詳しく説明した。",
  "この文脈では",
  "の意味を辞書で調べた。",
  "試験で",
  "が適切だ。",
];

const vocab = JSON.parse(
  readFileSync(join(process.cwd(), "content/vocab/n2.json"), "utf-8")
) as { id: string; meaning: string; example: string }[];

function isFullyJapanese(text: string): boolean {
  return (
    /[\u3040-\u30ff\u4e00-\u9fff]/.test(text) &&
    !/[a-zA-Z]/.test(text) &&
    !text.includes("という意味")
  );
}

function isTemplateExample(example: string): boolean {
  return TEMPLATE_PHRASES.some((p) => example.includes(p));
}

const jaCount = vocab.filter((v) => isFullyJapanese(v.meaning)).length;
const meaningRatio = jaCount / Math.max(vocab.length, 1);

const templateExamples = vocab.filter((v) => isTemplateExample(v.example));
const templateRatio = templateExamples.length / Math.max(vocab.length, 1);

console.log(`Vocab entries: ${vocab.length}`);
console.log(`Fully Japanese meanings: ${jaCount} (${Math.round(meaningRatio * 100)}%)`);
console.log(
  `Template examples: ${templateExamples.length} (${Math.round(templateRatio * 100)}%)`
);

if (meaningRatio < MEANING_THRESHOLD) {
  console.error(`Meaning quality below threshold ${Math.round(MEANING_THRESHOLD * 100)}%`);
  process.exit(1);
}

if (templateRatio > EXAMPLE_THRESHOLD) {
  console.warn(
    `Template example ratio ${Math.round(templateRatio * 100)}% exceeds target ${Math.round(EXAMPLE_THRESHOLD * 100)}%`
  );
  console.warn("Sample IDs:", templateExamples.slice(0, 10).map((v) => v.id).join(", "));
  if (process.env.STRICT_EXAMPLES === "1") {
    process.exit(1);
  }
}

console.log("Content quality check passed");
