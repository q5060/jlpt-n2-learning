#!/usr/bin/env npx tsx
/**
 * Generates N2 content JSON (grammar, kanji, reading, listening, placement, exam).
 * Run vocab fetch first: npx tsx scripts/fetch-vocab.ts
 */
import { writeFileSync, mkdirSync, existsSync, readFileSync } from "fs";
import { join } from "path";

type VocabItem = { id: string; word: string; reading: string; meaning: string; example: string; tags: string[]; jlptLevel: string };
type GrammarSeed = { pattern: string; connection: string; meaning: string; nuance: string; fill: string; ex1: string; ex2: string; ex3: string; reorder: string[]; wrong: string; correct: string };

const GRAMMAR_PATTERNS: GrammarSeed[] = [
  { pattern: "ばかりか〜も", connection: "名詞・動詞普通形", meaning: "〜だけでなく、さらに〜も", nuance: "驚きや強調のニュアンスが強い", fill: "ばかりか", ex1: "彼は日本語ばかりか英語も話せる。", ex2: "この店は料理ばかりかサービスも素晴らしい。", ex3: "彼女は歌ばかりかダンスも上手だ。", reorder: ["彼は", "日本語", "ばかりか", "英語", "も", "話せる"], wrong: "彼は日本語ばかり英語も話せる。", correct: "彼は日本語ばかりか英語も話せる。" },
  { pattern: "だけでなく〜も", connection: "名詞・動詞普通形", meaning: "〜だけではなく、〜も", nuance: "並列的に追加する表現", fill: "だけでなく", ex1: "彼は日本語だけでなく英語も話せる。", ex2: "この問題は理論だけでなく実践も必要だ。", ex3: "彼女は料理だけでなく掃除も上手だ。", reorder: ["彼は", "日本語", "だけでなく", "英語", "も", "話せる"], wrong: "彼は日本語だけ英語も話せる。", correct: "彼は日本語だけでなく英語も話せる。" },
  { pattern: "はもちろん〜も", connection: "名詞", meaning: "〜は当然として、〜も", nuance: "当然のこととして追加を列挙", fill: "はもちろん", ex1: "彼は日本語はもちろん英語も話せる。", ex2: "この製品は品質はもちろん価格も魅力的だ。", ex3: "彼女は歌はもちろんダンスも得意だ。", reorder: ["彼は", "日本語", "はもちろん", "英語", "も", "話せる"], wrong: "彼は日本語もちろん英語も話せる。", correct: "彼は日本語はもちろん英語も話せる。" },
  { pattern: "に限らず", connection: "名詞", meaning: "〜だけではなく、広く", nuance: "範囲を広げる表現", fill: "に限らず", ex1: "若者に限らず高齢者もスマホを使っている。", ex2: "日本に限らず世界中で問題になっている。", ex3: "専門家に限らず一般人も関心を持っている。", reorder: ["若者", "に限らず", "高齢者", "も", "スマホを使っている"], wrong: "若者だけでなく高齢者もスマホを使っている。", correct: "若者に限らず高齢者もスマホを使っている。" },
  { pattern: "に加えて", connection: "名詞", meaning: "〜に加えて、さらに", nuance: "累加の表現", fill: "に加えて", ex1: "給料に加えてボーナスももらえる。", ex2: "理論に加えて実習も行う。", ex3: "日本語に加えて英語も勉強している。", reorder: ["給料", "に加えて", "ボーナス", "も", "もらえる"], wrong: "給料とボーナスももらえる。", correct: "給料に加えてボーナスももらえる。" },
  { pattern: "をはじめ", connection: "名詞", meaning: "〜を始めとして", nuance: "代表例を挙げる", fill: "をはじめ", ex1: "東京をはじめ大都市で人口が増えている。", ex2: "数学をはじめ理科の成績が良い。", ex3: "社長をはじめ役員が出席した。", reorder: ["東京", "をはじめ", "大都市", "で", "人口が増えている"], wrong: "東京から大都市で人口が増えている。", correct: "東京をはじめ大都市で人口が増えている。" },
  { pattern: "を中心に", connection: "名詞", meaning: "〜を中心として", nuance: "中心点を示す", fill: "を中心に", ex1: "駅を中心に店が並んでいる。", ex2: "若者を中心に利用者が増えた。", ex3: "東京を中心に経済が発展した。", reorder: ["駅", "を中心に", "店", "が", "並んでいる"], wrong: "駅の中心に店が並んでいる。", correct: "駅を中心に店が並んでいる。" },
  { pattern: "に伴って", connection: "名詞・動詞辞書形", meaning: "〜とともに", nuance: "変化の連動を表す", fill: "に伴って", ex1: "経済成長に伴って生活水準も上がった。", ex2: "人口増加に伴って住宅需要が高まる。", ex3: "技術進歩に伴って仕事の内容も変わる。", reorder: ["経済成長", "に伴って", "生活水準", "も", "上がった"], wrong: "経済成長と生活水準も上がった。", correct: "経済成長に伴って生活水準も上がった。" },
  { pattern: "に応じて", connection: "名詞", meaning: "〜に合わせて", nuance: "対応関係を表す", fill: "に応じて", ex1: "能力に応じてクラスを分ける。", ex2: "需要に応じて生産量を調整する。", ex3: "状況に応じて対応を変える。", reorder: ["能力", "に応じて", "クラス", "を", "分ける"], wrong: "能力によってクラスを分ける。", correct: "能力に応じてクラスを分ける。" },
  { pattern: "に基づいて", connection: "名詞", meaning: "〜を基準として", nuance: "根拠・基準を示す", fill: "に基づいて", ex1: "事実に基づいて判断する。", ex2: "法律に基づいて処分する。", ex3: "データに基づいて計画を立てる。", reorder: ["事実", "に基づいて", "判断", "する"], wrong: "事実で判断する。", correct: "事実に基づいて判断する。" },
];

const KANJI_DATA: [string, string[], string[], string, { word: string; reading: string; meaning: string }[]][] = [
  ["維", ["い"], ["い"], "保つ", [{ word: "維持", reading: "いじ", meaning: "保ち続ける" }]],
  ["傾", ["けい"], ["かたむ"], "傾く", [{ word: "傾向", reading: "けいこう", meaning: "傾き" }]],
  ["握", ["あく"], ["にぎ"], "握る", [{ word: "把握", reading: "はあく", meaning: "理解する" }]],
  ["響", ["きょう"], ["ひび"], "響く", [{ word: "影響", reading: "えいきょう", meaning: "作用" }]],
  ["施", ["し"], ["ほどこ"], "施す", [{ word: "実施", reading: "じっし", meaning: "実行" }]],
  ["認", ["にん"], ["みと"], "認める", [{ word: "確認", reading: "かくにん", meaning: "確かめる" }]],
  ["討", ["とう"], ["う"], "討つ", [{ word: "検討", reading: "けんとう", meaning: "考える" }]],
  ["促", ["そく"], ["うなが"], "促す", [{ word: "促進", reading: "そくしん", meaning: "後押し" }]],
  ["抑", ["よく"], ["おさ"], "抑える", [{ word: "抑制", reading: "よくせい", meaning: "抑える" }]],
  ["拡", ["かく"], ["ひろ"], "拡がる", [{ word: "拡大", reading: "かくだい", meaning: "広げる" }]],
];

const EXTRA_KANJI = "政経済社会文化科学技術環境資源開発研究教育医療健康福祉安全危機管理政策制度法律規則基準条件方法手段目的結果効果影響変化発展進歩向上低下増減拡大縮小維持保存建設設立廃止導入採用実施実行達成実現完成開始終了継続中断再開確認検証証明否定承認拒否許可禁止命令指示提案推薦紹介説明報告通知連絡相談交渉討論調査分析比較検討判断決定選択評価批判称賛感謝努力挑戦克服解決処理対処対応参加訪問居住就職退職雇用収入支出予算費用価格契約変更改善改革創設設置廃棄節約消費購入販売取引品質標準範囲制限自由権利義務責任利益損害犯罪違反処罰裁判判決政治外交条約協定貿易輸出輸入市場競争規制管理監督指導教育訓練学習理解把握記憶計画作成編集出版印刷参考閲覧読解記録登録申請提出配布共有協力連携合併統合分離分配平等公正信頼尊敬冷静危険安全可能実現有効性能機能集中分散構成建設設計完成利用使用適用採用候補発表通知要求合格達成";

function loadVocab(): VocabItem[] {
  const p = join(process.cwd(), "content/vocab/n2.json");
  if (existsSync(p)) return JSON.parse(readFileSync(p, "utf-8"));
  return [];
}

function loadKanjiSeeds() {
  const p = join(process.cwd(), "content/kanji/n2-seeds.json");
  if (existsSync(p)) return JSON.parse(readFileSync(p, "utf-8"));
  return null;
}

function loadGrammarSeeds(): GrammarSeed[] | null {
  const p = join(process.cwd(), "content/grammar/n2-seeds.json");
  if (existsSync(p)) return JSON.parse(readFileSync(p, "utf-8"));
  return null;
}

function expandKanji() {
  const seeds = loadKanjiSeeds();
  if (seeds && Array.isArray(seeds) && seeds.length > 0) {
    return seeds.slice(0, 370).map((s: { character: string; onyomi: string[]; kunyomi: string[]; meaning: string; examples: { word: string; reading: string; meaning: string }[] }, i: number) => ({
      id: `k${String(i + 1).padStart(3, "0")}`,
      character: s.character,
      onyomi: s.onyomi ?? [],
      kunyomi: s.kunyomi ?? [],
      meaning: s.meaning,
      examples: s.examples?.length ? s.examples : [{ word: s.character, reading: s.onyomi?.[0] ?? "", meaning: s.meaning }],
      jlptLevel: "N2",
    }));
  }
  const kanji = [];
  const seen = new Set<string>();
  let idx = 0;
  for (const [char, on, kun, meaning, examples] of KANJI_DATA) {
    if (seen.has(char)) continue;
    seen.add(char);
    kanji.push({ id: `k${String(++idx).padStart(3, "0")}`, character: char, onyomi: on, kunyomi: kun, meaning, examples, jlptLevel: "N2" });
  }
  for (const char of EXTRA_KANJI) {
    if (seen.has(char) || kanji.length >= 370) continue;
    seen.add(char);
    kanji.push({ id: `k${String(++idx).padStart(3, "0")}`, character: char, onyomi: [char], kunyomi: [], meaning: `${char}に関する漢字`, examples: [{ word: char, reading: "", meaning: "語彙" }], jlptLevel: "N2" });
  }
  return kanji;
}

function expandGrammar() {
  const fileSeeds = loadGrammarSeeds();
  const seeds = fileSeeds && fileSeeds.length >= 200 ? fileSeeds : GRAMMAR_PATTERNS;
  const grammar = [];
  for (let i = 0; i < 200; i++) {
    const seed = seeds[i % seeds.length];
    const id = `g${String(i + 1).padStart(3, "0")}`;
    const week = Math.min(26, Math.ceil((i + 1) / 8));
    const title = fileSeeds ? (seed as GrammarSeed & { title?: string }).title ?? seed.pattern : seed.pattern;
    grammar.push({
      id, title, pattern: seed.pattern, connection: seed.connection,
      meaning: seed.meaning, nuance: seed.nuance,
      examples: [{ japanese: seed.ex1, note: "例文1" }, { japanese: seed.ex2, note: "例文2" }, { japanese: seed.ex3, note: "例文3" }],
      similarGrammar: seeds.filter((_, j) => j !== i % seeds.length).slice(0, 2).map((g) => g.pattern),
      week,
      exercises: [
        { id: `${id}-fill-1`, type: "fill_blank", question: `正しいものを選びなさい：彼は日本語___英語も話せる。`, options: [seed.fill, "だけ", "ばかり", "しか"], correctAnswer: seed.fill, explanation: `「${seed.pattern}」の使い方を確認しましょう。` },
        { id: `${id}-meaning-1`, type: "meaning", question: `「${seed.pattern}」の意味として正しいものは？`, options: [seed.meaning, "〜するために", "〜した結果", "〜するなら"], correctAnswer: seed.meaning, explanation: seed.nuance },
        { id: `${id}-reorder-1`, type: "reorder", question: "正しい順序に並べ替えなさい", options: seed.reorder, correctAnswer: seed.reorder, explanation: `「${seed.pattern}」の語順に注意。` },
        { id: `${id}-correction-1`, type: "correction", question: `誤りを訂正しなさい：${seed.wrong}`, correctAnswer: seed.correct, explanation: `正しい形は「${seed.pattern}」です。` },
      ],
    });
  }
  return grammar;
}

function expandReading() {
  const topics = ["環境問題", "技術革新", "教育制度", "健康管理", "経済動向", "文化交流", "社会問題", "科学発見", "都市開発", "国際関係", "労働環境", "消費行動", "交通政策", "食品安全", "高齢化社会", "少子化", "観光産業", "エネルギー", "情報化社会", "法律改正"];
  const intros = ["近年", "昨今", "このところ", "最近", "ここ数年"];
  const bodies = [
    "専門家の間では意見が分かれており、簡単な解決策は見つかっていない。",
    "一方で、一般市民の関心も高まり、具体的な行動を求める声が強くなっている。",
    "政府は関連する政策の見直しを進めており、今後の動向が注目されている。",
    "この問題は私たちの日常生活に深く関わっており、個人の意識改革も欠かせない。",
    "国際的な協力体制の構築も重要であり、グローバルな視点での取り組みが求められている。",
    "企業や自治体も独自の対策を始めており、多様なアプローチが試されている。",
    "調査によると、若い世代と高齢者の間で認識の差が大きいことも明らかになった。",
    "メディアの報道を通じて関心が広がり、議論はますます活発化している。",
  ];
  const passages = [];
  for (let i = 0; i < 60; i++) {
    const topic = topics[i % topics.length];
    const id = `r${String(i + 1).padStart(3, "0")}`;
    const level = i < 20 ? "N3" : "N2";
    const paragraphs = [];
    paragraphs.push(`${intros[i % intros.length]}、${topic}についての議論が活発になっている。`);
    for (let p = 0; p < 8; p++) {
      paragraphs.push(bodies[(i + p) % bodies.length]);
    }
    paragraphs.push(`筆者は、${topic}に関する問題は一朝一夕に解決できるものではないと指摘している。`);
    paragraphs.push(`一方、楽観的な見方もあり、適切な対策を講じれば改善の余地は十分にあるとする意見も根強い。`);
    paragraphs.push(`以上のことから、${topic}は今後も社会全体で取り組むべき課題であると言える。`);
    const content = paragraphs.join("");
    passages.push({
      id, title: `${topic}について（${level}）`, level, content,
      timeLimitMinutes: level === "N3" ? 8 : 12,
      questions: [
        { id: `${id}-q1`, question: "この文章の主旨は何か。", options: [`${topic}への取り組みの重要性`, `${topic}の歴史`, `${topic}の技術詳細`, `${topic}の否定`], correctIndex: 0, explanation: "文章全体が問題への取り組みの必要性を述べている。", trapType: "主旨誤判" },
        { id: `${id}-q2`, question: "専門家の意見について正しいのはどれか。", options: ["意見が分かれており簡単な解決策はない", "全員が一致している", "解決策は既に見つかった", "議論は行われていない"], correctIndex: 0, explanation: "専門家間で意見が分かれていると述べられている。", trapType: "否定範囲" },
        { id: `${id}-q3`, question: "筆者が言いたいことは何か。", options: ["個人と社会の両方の努力が必要", "政府だけが対応すべき", "個人の努力は無意味", "国際協力は不要"], correctIndex: 0, explanation: "個人の意識と国際協力の両方に言及している。", trapType: "指示詞" },
        { id: `${id}-q4`, question: "この文章の結論として最も適切なのはどれか。", options: [`${topic}は継続的な取り組みが必要`, `${topic}は解決済み`, `${topic}は無視してよい`, `${topic}は専門家だけの問題`], correctIndex: 0, explanation: "最終段落で社会全体の課題と結んでいる。", trapType: "推論" },
      ],
    });
  }
  return passages;
}

function expandListening(vocab: VocabItem[]) {
  const types = ["task", "point", "overview", "instant"] as const;
  const labels = { task: "課題理解", point: "ポイント理解", overview: "概要理解", instant: "即時応答" };
  const items = [];
  for (let i = 0; i < 120; i++) {
    const type = types[i % 4];
    const id = `l${String(i + 1).padStart(3, "0")}`;
    const w = vocab[i % Math.max(vocab.length, 1)];
    const opts = type === "instant"
      ? ["そうですね。", "わかりません。", "お疲れ様です。", "結構です。"]
      : [`${w?.meaning ?? "内容A"}`, "内容B", "内容C", "内容D"];
    items.push({
      id, title: `${labels[type]} 問題 ${i + 1}`, type,
      audioUrl: `/audio/listening/${id}.mp3`,
      transcript: `男：${w?.word ?? "今日"}についてどう思いますか。女：${opts[0]}と思います。`,
      tags: ["n2", type],
      questions: [{ id: `${id}-q1`, question: type === "instant" ? "最も適切な応答は？" : "会話の内容として正しいのはどれか。", options: opts, correctIndex: 0, explanation: `${labels[type]}のポイントを確認しましょう。` }],
    });
  }
  return items;
}

function shuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function expandPlacement(vocab: VocabItem[], kanji: ReturnType<typeof expandKanji>, grammar: ReturnType<typeof expandGrammar>, reading: ReturnType<typeof expandReading>, listening: ReturnType<typeof expandListening>) {
  const questions = [];
  let qIdx = 0;
  for (let i = 0; i < 30; i++) {
    const v = vocab[i % vocab.length];
    const wrong = shuffle(vocab.filter((x) => x.id !== v.id).map((x) => x.reading), i + 1).slice(0, 3);
    const opts = shuffle([v.reading, ...wrong], i);
    questions.push({ id: `p${String(++qIdx).padStart(3, "0")}`, skill: "vocab", level: i < 10 ? "N3" : "N2", prompt: `「${v.word}」の読み方は？`, options: opts, correctIndex: opts.indexOf(v.reading), contentId: v.id });
  }
  for (let i = 0; i < 20; i++) {
    const k = kanji[i % kanji.length];
    const opts = shuffle([k.meaning, "動詞", "形容詞", "副詞"], i);
    questions.push({ id: `p${String(++qIdx).padStart(3, "0")}`, skill: "kanji", level: "N2", prompt: `「${k.character}」の意味は？`, options: opts, correctIndex: opts.indexOf(k.meaning), contentId: k.id });
  }
  for (let i = 0; i < 25; i++) {
    const g = grammar[i % grammar.length];
    const opts = shuffle([g.meaning, "〜するために", "〜した結果", "〜するなら"], i);
    questions.push({ id: `p${String(++qIdx).padStart(3, "0")}`, skill: "grammar", level: "N2", prompt: `「${g.pattern}」の意味は？`, options: opts, correctIndex: opts.indexOf(g.meaning), contentId: g.id });
  }
  for (let ri = 0; ri < 8; ri++) {
    const r = reading[ri % reading.length];
    const q = r.questions[ri % r.questions.length];
    questions.push({ id: `p${String(++qIdx).padStart(3, "0")}`, skill: "reading", level: "N2", prompt: q.question, options: q.options, correctIndex: q.correctIndex, contentId: r.id });
  }
  for (let li = 0; li < 8; li++) {
    const l = listening[li % listening.length];
    const q = l.questions[li % l.questions.length];
    questions.push({ id: `p${String(++qIdx).padStart(3, "0")}`, skill: "listening", level: "N2", prompt: q.question, options: q.options, correctIndex: q.correctIndex, contentId: l.id });
  }
  return questions;
}

function expandExam(vocab: VocabItem[], kanji: ReturnType<typeof expandKanji>, grammar: ReturnType<typeof expandGrammar>, reading: ReturnType<typeof expandReading>, listening: ReturnType<typeof expandListening>) {
  const questions = [];
  let idx = 0;
  for (let i = 0; i < 35; i++) {
    const skill = (["vocab", "kanji", "grammar"] as const)[i % 3];
    if (skill === "vocab") {
      const v = vocab[i % vocab.length];
      const wrong = shuffle(vocab.filter((x) => x.id !== v.id).map((x) => x.reading), i).slice(0, 3);
      const opts = shuffle([v.reading, ...wrong], i);
      questions.push({ id: `eq${String(++idx).padStart(3, "0")}`, section: "language", skill, prompt: `「${v.word}」の読み方は？`, options: opts, correctIndex: opts.indexOf(v.reading), explanation: `正解は「${v.reading}」です。` });
    } else if (skill === "kanji") {
      const k = kanji[i % kanji.length];
      const opts = shuffle([k.meaning, "名詞", "動詞", "形容詞"], i);
      questions.push({ id: `eq${String(++idx).padStart(3, "0")}`, section: "language", skill, prompt: `「${k.character}」の意味は？`, options: opts, correctIndex: opts.indexOf(k.meaning), explanation: `「${k.character}」は「${k.meaning}」の意味です。` });
    } else {
      const g = grammar[i % grammar.length];
      const fill = g.exercises[0];
      questions.push({ id: `eq${String(++idx).padStart(3, "0")}`, section: "language", skill, prompt: fill.question, options: fill.options, correctIndex: fill.options!.indexOf(fill.correctAnswer as string), explanation: fill.explanation });
    }
  }
  for (let i = 0; i < 20; i++) {
    const r = reading[i % reading.length];
    const q = r.questions[i % r.questions.length];
    questions.push({ id: `eq${String(++idx).padStart(3, "0")}`, section: "reading", skill: "reading", prompt: q.question, options: q.options, correctIndex: q.correctIndex, passageId: r.id, explanation: q.explanation });
  }
  for (let i = 0; i < 28; i++) {
    const l = listening[i % listening.length];
    const q = l.questions[0];
    questions.push({ id: `eq${String(++idx).padStart(3, "0")}`, section: "listening", skill: "listening", prompt: q.question, options: q.options, correctIndex: q.correctIndex, audioUrl: l.audioUrl, explanation: q.explanation });
  }
  return questions;
}

const contentDir = join(process.cwd(), "content");
for (const d of ["vocab", "kanji", "grammar", "reading", "listening", "placement", "exam", "dict"]) {
  const p = join(contentDir, d);
  if (!existsSync(p)) mkdirSync(p, { recursive: true });
}

const vocab = loadVocab();
const kanji = expandKanji();
const grammar = expandGrammar();
const reading = expandReading();
const listening = expandListening(vocab);

writeFileSync(join(contentDir, "kanji", "n2.json"), JSON.stringify(kanji, null, 2));
writeFileSync(join(contentDir, "grammar", "n2.json"), JSON.stringify(grammar, null, 2));
writeFileSync(join(contentDir, "reading", "n2.json"), JSON.stringify(reading, null, 2));
writeFileSync(join(contentDir, "listening", "n2.json"), JSON.stringify(listening, null, 2));
writeFileSync(join(contentDir, "placement", "test.json"), JSON.stringify(expandPlacement(vocab, kanji, grammar, reading, listening), null, 2));
writeFileSync(join(contentDir, "exam", "n2-mock.json"), JSON.stringify(expandExam(vocab, kanji, grammar, reading, listening), null, 2));
writeFileSync(join(contentDir, "grammar", "confusion-pairs.json"), JSON.stringify([
  { a: "ばかりか〜も", b: "だけでなく〜も", difference: "ばかりかの方が驚き・強調のニュアンスが強い" },
  { a: "ばかりか〜も", b: "はもちろん〜も", difference: "はもちろんは当然のこととして列挙する" },
  { a: "に限らず", b: "に加えて", difference: "に限らずは範囲拡大、に加えては累加" },
  { a: "に伴って", b: "に応じて", difference: "に伴っては連動変化、に応じては対応" },
  { a: "に基づいて", b: "によって", difference: "に基づいては根拠・基準、によっては手段・原因" },
  { a: "をはじめ", b: "を中心に", difference: "をはじめは代表例、を中心には焦点" },
  { a: "わけではない", b: "とは限らない", difference: "わけではないは部分否定、とは限らないは一般化の否定" },
  { a: "ものの", b: "とはいえ", difference: "もののは逆接、とはいえは譲歩" },
  { a: "おそれがある", b: "恐れがある", difference: "おそれがあるは悪い結果の心配、恐れがあるは敬語的表現" },
  { a: "に違いない", b: "に決まっている", difference: "に違いないは推量、に決まっているは確信" },
  { a: "ばかりだ", b: "一方だ", difference: "ばかりだは変化の継続、一方だは悪化の一方通行" },
  { a: "にすぎない", b: "にほかならない", difference: "にすぎないは程度の限定、にほかならないは強調" },
  { a: "からには", b: "以上は", difference: "からにはは覚悟、以上は義務・責任" },
  { a: "てたまらない", b: "てしょうがない", difference: "てたまらないは感情が強い、てしょうがないは程度がやや弱い" },
  { a: "に際して", b: "にあたって", difference: "に際しては正式な場面、にあたっては開始の場面" },
  { a: "をめぐって", b: "を通じて", difference: "をめぐっては議論の対象、を通じては手段・期間" },
  { a: "にわたって", b: "にわたり", difference: "にわたっては範囲・期間の広がり" },
  { a: "を問わず", b: "を除いて", difference: "を問わずは例外なし、を除いては除外" },
], null, 2));

console.log("Content generated:", { vocab: vocab.length, kanji: kanji.length, grammar: grammar.length, reading: reading.length, listening: listening.length });
