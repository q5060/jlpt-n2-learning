#!/usr/bin/env npx tsx
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const SOURCES = [
  "https://raw.githubusercontent.com/Doublevil/JlptDictionary/main/JlptDictionary/JlptDictionary.N2.csv",
];

type KanjiSeed = {
  character: string;
  onyomi: string[];
  kunyomi: string[];
  meaning: string;
  examples: { word: string; reading: string; meaning: string }[];
};

const FALLBACK: KanjiSeed[] = [
  { character: "維", onyomi: ["い"], kunyomi: [], meaning: "保つ", examples: [{ word: "維持", reading: "いじ", meaning: "保ち続ける" }] },
  { character: "傾", onyomi: ["けい"], kunyomi: ["かたむ"], meaning: "傾く", examples: [{ word: "傾向", reading: "けいこう", meaning: "傾き" }] },
  { character: "握", onyomi: ["あく"], kunyomi: ["にぎ"], meaning: "握る", examples: [{ word: "把握", reading: "はあく", meaning: "理解する" }] },
  { character: "響", onyomi: ["きょう"], kunyomi: ["ひび"], meaning: "響く", examples: [{ word: "影響", reading: "えいきょう", meaning: "作用" }] },
  { character: "施", onyomi: ["し"], kunyomi: ["ほどこ"], meaning: "施す", examples: [{ word: "実施", reading: "じっし", meaning: "実行" }] },
  { character: "認", onyomi: ["にん"], kunyomi: ["みと"], meaning: "認める", examples: [{ word: "確認", reading: "かくにん", meaning: "確かめる" }] },
  { character: "討", onyomi: ["とう"], kunyomi: ["う"], meaning: "討つ", examples: [{ word: "検討", reading: "けんとう", meaning: "考える" }] },
  { character: "促", onyomi: ["そく"], kunyomi: ["うなが"], meaning: "促す", examples: [{ word: "促進", reading: "そくしん", meaning: "後押し" }] },
  { character: "抑", onyomi: ["よく"], kunyomi: ["おさ"], meaning: "抑える", examples: [{ word: "抑制", reading: "よくせい", meaning: "抑える" }] },
  { character: "拡", onyomi: ["かく"], kunyomi: ["ひろ"], meaning: "拡がる", examples: [{ word: "拡大", reading: "かくだい", meaning: "広げる" }] },
];

async function fetchCsv(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function kanjiFromVocab(): KanjiSeed[] {
  const vocabPath = join(process.cwd(), "content/vocab/n2.json");
  if (!existsSync(vocabPath)) return [];
  const vocab = JSON.parse(readFileSync(vocabPath, "utf-8")) as { word: string; reading: string; meaning: string }[];
  const seeds: KanjiSeed[] = [];
  const charMap = new Map<string, KanjiSeed>();

  for (const v of vocab) {
    const kanjiChars = [...v.word].filter((ch) => /[\u4e00-\u9fff]/.test(ch));
    if (kanjiChars.length === 0) continue;

    if (v.word.length === 1 && kanjiChars.length === 1) {
      const ch = v.word;
      if (!charMap.has(ch)) {
        charMap.set(ch, {
          character: ch,
          onyomi: v.reading.match(/^[ァ-ヶー]+/) ? [v.reading] : [],
          kunyomi: v.reading.match(/^[ぁ-んー]+/) ? [v.reading] : [],
          meaning: v.meaning.split(/[;,]/)[0].slice(0, 30),
          examples: [{ word: v.word, reading: v.reading, meaning: v.meaning }],
        });
      }
      continue;
    }

    for (const ch of kanjiChars) {
      if (charMap.has(ch)) {
        const existing = charMap.get(ch)!;
        if (existing.examples.length < 3 && !existing.examples.some((e) => e.word === v.word)) {
          existing.examples.push({ word: v.word, reading: v.reading, meaning: v.meaning });
        }
        continue;
      }
      const on = v.reading.length <= 4 ? [v.reading.slice(0, 2)] : [];
      charMap.set(ch, {
        character: ch,
        onyomi: on,
        kunyomi: [],
        meaning: v.meaning.split(/[;,]/)[0].slice(0, 30),
        examples: [{ word: v.word, reading: v.reading, meaning: v.meaning }],
      });
    }
  }

  for (const seed of charMap.values()) {
    if (!seed.onyomi.length && !seed.kunyomi.length && seed.examples[0]?.reading) {
      const r = seed.examples[0].reading;
      seed.onyomi = [r.slice(0, Math.min(4, r.length))];
    }
    seeds.push(seed);
    if (seeds.length >= 370) break;
  }
  return seeds;
}

async function main() {
  let seeds: KanjiSeed[] = [...FALLBACK];
  const seen = new Set(seeds.map((s) => s.character));

  for (const url of SOURCES) {
    const text = await fetchCsv(url);
    if (!text) continue;
    const lines = text.split("\n").slice(1);
    for (const line of lines) {
      const cols = line.split(",");
      const character = cols[0]?.trim();
      if (!character || character.length !== 1 || seen.has(character)) continue;
      const onyomi = (cols[1] ?? "").split(/[・\s]+/).filter(Boolean);
      const kunyomi = (cols[2] ?? "").split(/[・\s]+/).filter(Boolean);
      const meaning = cols[3]?.trim() || `${character}の漢字`;
      seen.add(character);
      seeds.push({ character, onyomi, kunyomi, meaning, examples: [{ word: character, reading: onyomi[0] ?? kunyomi[0] ?? "", meaning }] });
    }
    if (seeds.length >= 370) break;
  }

  if (seeds.length < 370) {
    for (const s of kanjiFromVocab()) {
      if (seen.has(s.character)) continue;
      seen.add(s.character);
      seeds.push(s);
      if (seeds.length >= 370) break;
    }
  }

  seeds = seeds.slice(0, 370);
  const outDir = join(process.cwd(), "content/kanji");
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "n2-seeds.json"), JSON.stringify(seeds, null, 2));
  console.log(`Wrote ${seeds.length} kanji seeds`);
}

main();
