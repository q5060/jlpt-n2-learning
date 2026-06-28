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

function enrichExample(word: string): string {
  const idx = word.charCodeAt(0) % EXAMPLE_TEMPLATES.length;
  return EXAMPLE_TEMPLATES[idx](word);
}

const EN_TO_JA: Record<string, string> = {
  inauguration: "就任",
  circumference: "周囲",
  director: "取締役",
  end: "終わり",
  gravity: "重力",
  idiom: "熟語",
  accommodation: "宿泊",
  reduction: "縮小",
  fate: "運命",
  affiliation: "所属",
  processing: "処理",
  advice: "助言",
  business: "商売",
  consumption: "消費",
  promotion: "昇進",
  proof: "証明",
  symptom: "症状",
  boss: "上司",
  details: "詳細",
  state: "状態",
  rise: "上昇",
  focus: "焦点",
  consumer: "消費者",
  evidence: "証拠",
  occupation: "職業",
  appetite: "食欲",
  population: "人口",
  life: "人生",
  human: "人間",
  popularity: "人気",
  progress: "進歩",
  trust: "信用",
  psychology: "心理",
  newspaper: "新聞",
  forest: "森林",
  diagnosis: "診断",
  sleep: "睡眠",
  equipment: "設備",
  responsibility: "責任",
  effort: "努力",
  ability: "能力",
};

function loadSeedMap(): Map<string, { word: string; reading: string; meaning: string }> {
  const map = new Map<string, { word: string; reading: string; meaning: string }>();
  if (existsSync(LOCAL_SEED)) {
    const seed = JSON.parse(readFileSync(LOCAL_SEED, "utf-8")) as {
      word: string;
      reading: string;
      meaning: string;
    }[];
    for (const s of seed) map.set(s.word, s);
  }
  return map;
}

function isFullyJapanese(text: string): boolean {
  return /[\u3040-\u30ff\u4e00-\u9fff]/.test(text) && !/[a-zA-Z]/.test(text);
}

function toJapaneseMeaning(
  meaning: string,
  word: string,
  reading: string,
  seedMap: Map<string, { meaning: string }>
): string {
  const seed = seedMap.get(word);
  if (seed) return seed.meaning;

  if (isFullyJapanese(meaning) && !meaning.includes("という意味")) {
    return meaning;
  }

  const enMatch = meaning.match(/—\s*([a-zA-Z][a-zA-Z\s-]*)/i);
  const enKey = enMatch?.[1]?.trim().toLowerCase().split(/[\s,;]+/)[0];
  if (enKey && EN_TO_JA[enKey]) {
    return `（名）${EN_TO_JA[enKey]}`;
  }

  const short = meaning.replace(/[()]/g, "").split(/[,;—]/)[0].replace(/「[^」]+」/g, "").trim();
  if (short.length > 0 && short.length <= 16 && /[\u3040-\u30ff\u4e00-\u9fff]/.test(short)) {
    return `（名）${short}`;
  }

  return `（名）${word}。${reading}と読む`;
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

  const seedMap = loadSeedMap();

  const seen = new Set<string>();
  const vocab = [];
  for (const r of rows) {
    if (!r.word || seen.has(r.word)) continue;
    seen.add(r.word);
    vocab.push({
      id: `v${String(vocab.length + 1).padStart(4, "0")}`,
      word: r.word,
      reading: r.reading,
      meaning: toJapaneseMeaning(r.meaning, r.word, r.reading, seedMap),
      example: enrichExample(r.word),
      tags: ["n2"],
      jlptLevel: "N2",
    });
  }

  const out = join(process.cwd(), "content/vocab/n2.json");
  writeFileSync(out, JSON.stringify(vocab, null, 2));
  const jaCount = vocab.filter((v) => isFullyJapanese(v.meaning)).length;
  console.log(`Wrote ${vocab.length} vocabulary entries (${jaCount} fully JA meanings)`);
}

main();
