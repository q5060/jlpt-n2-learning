#!/usr/bin/env npx tsx
import { writeFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";
import Papa from "papaparse";

const SOURCES = [
  "https://raw.githubusercontent.com/elzup/jlpt-word-list/master/src/n2.csv",
  "https://raw.githubusercontent.com/Bluskyo/JLPT_Vocabulary/main/n2_vocab_cleaned.csv",
];

const LOCAL_SEED = join(process.cwd(), "content/vocab/n2-seed.json");

async function fetchCsv(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

const EXAMPLE_TEMPLATES = [
  (w: string) => `${w}は日常会話でよく使われる。`,
  (w: string) => `彼は${w}について詳しく説明した。`,
  (w: string) => `この文脈では${w}が適切だ。`,
  (w: string) => `${w}の意味を辞書で調べた。`,
  (w: string) => `試験で${w}が出題された。`,
];

function enrichExample(word: string, reading: string): string {
  const idx = word.charCodeAt(0) % EXAMPLE_TEMPLATES.length;
  return EXAMPLE_TEMPLATES[idx](word);
}

function toJapaneseMeaning(meaning: string, word: string, reading: string): string {
  if (/[\u3040-\u30ff\u4e00-\u9fff]/.test(meaning) && !meaning.includes("の語彙")) {
    return meaning;
  }
  const short = meaning.replace(/[()]/g, "").split(/[,;]/)[0].trim();
  if (short.length <= 12) {
    return `「${word}」（${reading}）— ${short}という意味の語`;
  }
  return `「${word}」— ${short}`;
}
function parseCsv(text: string) {
  const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true });
  const rows: { word: string; reading: string; meaning: string }[] = [];
  for (const row of parsed.data) {
    const word = row.expression ?? row.word ?? row.kanji ?? row.単語 ?? Object.values(row)[0] ?? "";
    const reading = row.reading ?? row.kana ?? row.読み ?? Object.values(row)[1] ?? "";
    const meaning = row.meaning ?? row.glossary ?? row.意味 ?? row.english ?? Object.values(row)[2] ?? "";
    if (word && reading) rows.push({ word: word.trim(), reading: reading.trim(), meaning: (meaning || `${word}の語彙`).trim() });
  }
  return rows;
}

async function main() {
  let rows: { word: string; reading: string; meaning: string }[] = [];
  for (const url of SOURCES) {
    const text = await fetchCsv(url);
    if (text) {
      rows = parseCsv(text);
      if (rows.length > 50) {
        console.log(`Fetched ${rows.length} from ${url}`);
        break;
      }
    }
  }

  if (existsSync(LOCAL_SEED)) {
    const seed = JSON.parse(readFileSync(LOCAL_SEED, "utf-8")) as { word: string; reading: string; meaning: string }[];
    rows.push(...seed);
  }

  const seen = new Set<string>();
  const vocab = [];
  for (const r of rows) {
    if (!r.word || seen.has(r.word)) continue;
    seen.add(r.word);
    vocab.push({
      id: `v${String(vocab.length + 1).padStart(4, "0")}`,
      word: r.word,
      reading: r.reading,
      meaning: toJapaneseMeaning(r.meaning, r.word, r.reading),
      example: enrichExample(r.word, r.reading),
      tags: ["n2"],
      jlptLevel: "N2",
    });
  }

  const out = join(process.cwd(), "content/vocab/n2.json");
  writeFileSync(out, JSON.stringify(vocab, null, 2));
  console.log(`Wrote ${vocab.length} vocabulary entries`);
}

main();
