#!/usr/bin/env npx tsx
/**
 * Generates content/vocab/n2-seed.json — Japanese glosses for top 200 N2 words.
 */
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const JA_GLOSS: Record<string, string> = {
  就任: "（名・自サ）職務や地位につくこと",
  周辺: "（名）まわり。近く",
  重役: "（名）会社などの重要な役職にある人",
  終了: "（名・自サ）終わること",
  重量: "（名）物の重さ",
  重力: "（名）地心引力",
  熟語: "（名）二つ以上の漢字からなる語",
  宿泊: "（名・自サ）旅館などに泊まること",
  縮小: "（名・自他サ）小さくすること",
  宿命: "（名）運命として定められたこと",
  所属: "（名・自サ）組織に属すること",
  処理: "（名・他サ）事務や問題を処理すること",
  書斎: "（名）読書や執筆をする部屋",
  書籍: "（名）本。図書",
  初歩: "（名）物事の始めの段階",
  助言: "（名・他サ）助けとなる意見を言うこと",
  商売: "（名）商品を売ること",
  奨学金: "（名）学費を援助する金銭",
  消費: "（名・他サ）費い消すこと",
  昇進: "（名・自サ）地位が上がること",
  証明: "（名・他サ）事実であることを示すこと",
  症状: "（名）病気のけいれい",
  上司: "（名）職場で上の立場の人",
  消耗: "（名・自他サ）使って減らすこと",
  奨励: "（名・他サ）励まし勧めること",
  詳細: "（名・形動）細かく詳しい",
  状態: "（名）物事のありさま",
  上昇: "（名・自サ）高く上がること",
  焦点: "（名）注目の中心",
  消極的: "（形動）進んで行動しない",
  消費者: "（名）商品を使う人",
  証拠: "（名）事実を証明する手がかり",
  職業: "（名）生活のための仕事",
  食糧: "（名）食べ物",
  食欲: "（名）食べ物が欲しい気持ち",
  食器: "（名）食事に使う道具",
  食品: "（名）食べ物としての品物",
  人事: "（名）人の採用・配置など",
  人生: "（名）人が生きること",
  人口: "（名）住民の数",
  人物: "（名）人柄。有名人",
  人種: "（名）身体的特徴による分類",
  人間: "（名）人",
  人気: "（名）好かれること",
  人工: "（名）人の手で作られたこと",
  人材: "（名）優れた能力を持つ人",
  神経: "（名）神経組織。気持ちの敏感さ",
  真剣: "（形動）本気。まじめ",
  進歩: "（名・自サ）より良い状態に進むこと",
  信用: "（名・他サ）信じて頼むこと",
  信頼: "（名・他サ）信じて頼りにすること",
  心理: "（名）心の働き",
  新聞: "（名）日々の出来事を伝える印刷物",
  親切: "（形動）人に親しみを持って助ける",
  森林: "（名）木が茂った広い土地",
  進学: "（名・自サ）上の学校に入ること",
  親友: "（名）とても仲の良い友達",
  診断: "（名・他サ）病状を調べること",
  迅速: "（形動）素早い",
  水準: "（名）基準の高さ",
  推薦: "（名・他サ）すすめること",
  睡眠: "（名・自サ）眠ること",
  設備: "（名）施設や装置",
  絶対: "（形動）どうしても",
  設置: "（名・他サ）設備を整えること",
  設定: "（名・他サ）決めて設けること",
  節約: "（名・他サ）費用を省くこと",
  責任: "（名）果たすべき義務",
  積極的: "（形動）進んで行動する",
  設計: "（名・他サ）計画を立てること",
  努力: "（名・自サ）力を尽くすこと",
  能力: "（名）できる力",
  農業: "（名）農作物を育てる産業",
  農家: "（名）農業をする家",
  農村: "（名）農業が主な村",
  農地: "（名）農業に使う土地",
  農民: "（名）農業をする人",
  連続: "（名・自サ）続くこと",
  連絡: "（名・他サ）知らせ合うこと",
  連盟: "（名）共同の組織",
  連邦: "（名）複数の国・州の連合体",
  連帯: "（名）共に結びつくこと",
  連日: "（名）続けて毎日",
  連続: "（名）途切れず続くこと",
  連休: "（名）続けて休みの日",
  連載: "（名）続けて掲載すること",
  連鎖: "（名）つながり合うこと",
  連動: "（名・自サ）連動すること",
  連携: "（名・自サ）協力して行動すること",
};

const EN_TO_JA: Record<string, string> = {
  inauguration: "就任",
  circumference: "周囲",
  director: "取締役",
  end: "終わり",
  heavyweight: "重量級",
  gravity: "重力",
  idiom: "熟語",
  accommodation: "宿泊",
  reduction: "縮小",
  fate: "運命",
  affiliation: "所属",
  processing: "処理",
  study: "書斎",
  book: "書籍",
  basics: "初歩",
  advice: "助言",
  business: "商売",
  scholarship: "奨学金",
  consumption: "消費",
  promotion: "昇進",
  proof: "証明",
  symptom: "症状",
  boss: "上司",
  encouragement: "奨励",
  details: "詳細",
  state: "状態",
  rise: "上昇",
  focus: "焦点",
  passive: "消極的",
  consumer: "消費者",
  evidence: "証拠",
  occupation: "職業",
  food: "食糧",
  appetite: "食欲",
  tableware: "食器",
  population: "人口",
  life: "人生",
  person: "人物",
  race: "人種",
  human: "人間",
  popularity: "人気",
  artificial: "人工",
  talent: "人材",
  nerve: "神経",
  serious: "真剣",
  progress: "進歩",
  trust: "信用",
  confidence: "信頼",
  psychology: "心理",
  newspaper: "新聞",
  kind: "親切",
  forest: "森林",
  friend: "親友",
  diagnosis: "診断",
  rapid: "迅速",
  level: "水準",
  recommendation: "推薦",
  sleep: "睡眠",
  equipment: "設備",
  absolute: "絶対",
  installation: "設置",
  setting: "設定",
  saving: "節約",
  responsibility: "責任",
  active: "積極的",
  design: "設計",
  effort: "努力",
  ability: "能力",
  agriculture: "農業",
};

function extractEnglish(meaning: string): string | null {
  const m = meaning.match(/—\s*([a-zA-Z][a-zA-Z\s-]*)/i);
  return m?.[1]?.trim().toLowerCase().split(/[\s,;]+/)[0] ?? null;
}

function isFullyJapanese(text: string): boolean {
  return /[\u3040-\u30ff\u4e00-\u9fff]/.test(text) && !/[a-zA-Z]/.test(text) && !text.includes("という意味");
}

function glossFor(word: string, reading: string, meaning: string): string {
  if (JA_GLOSS[word]) return JA_GLOSS[word];
  const en = extractEnglish(meaning);
  if (en && EN_TO_JA[en]) return `（名）${EN_TO_JA[en]}`;
  if (isFullyJapanese(meaning)) {
    return meaning.replace(/^「[^」]+」[（(][^）)]+[）)]\s*/, "").trim() || meaning;
  }
  return `（名）${word}。${reading}と読む語`;
}

function main() {
  const vocab = JSON.parse(
    readFileSync(join(process.cwd(), "content/vocab/n2.json"), "utf-8")
  ) as { word: string; reading: string; meaning: string }[];

  const seed: { word: string; reading: string; meaning: string }[] = [];
  const seen = new Set<string>();

  for (const v of vocab) {
    if (seed.length >= 200) break;
    if (seen.has(v.word)) continue;
    seen.add(v.word);
    seed.push({
      word: v.word,
      reading: v.reading,
      meaning: glossFor(v.word, v.reading, v.meaning),
    });
  }

  const out = join(process.cwd(), "content/vocab/n2-seed.json");
  writeFileSync(out, JSON.stringify(seed, null, 2));
  console.log(`Wrote ${seed.length} seed entries`);
}

main();
