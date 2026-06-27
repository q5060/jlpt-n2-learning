import { addDays, differenceInCalendarDays, parseISO } from "date-fns";
import { getSettings, db } from "@/lib/db/local/schema";
import { getDueCount } from "@/lib/srs/fsrs";
import { computePriority, getWeaknessScores } from "@/lib/weakness/engine";
import { getDueReviewCount } from "@/lib/weakness/review-queue";
import type { DailyTask, SkillTag } from "@/lib/types";

export interface WeekPlan {
  week: number;
  phase: string;
  grammarRange: [number, number];
  vocabTarget: number;
  kanjiTarget: number;
  focus: string;
}

export const WEEKLY_PLAN: WeekPlan[] = [
  { week: 1, phase: "基礎固め", grammarRange: [1, 13], vocabTarget: 70, kanjiTarget: 20, focus: "核心語彙と基本文法" },
  { week: 2, phase: "基礎固め", grammarRange: [14, 26], vocabTarget: 140, kanjiTarget: 40, focus: "語彙拡大" },
  { week: 3, phase: "基礎固め", grammarRange: [27, 39], vocabTarget: 210, kanjiTarget: 60, focus: "文法の定着" },
  { week: 4, phase: "基礎固め", grammarRange: [40, 52], vocabTarget: 280, kanjiTarget: 80, focus: "読解入門" },
  { week: 5, phase: "基礎固め", grammarRange: [53, 65], vocabTarget: 340, kanjiTarget: 100, focus: "複合文法" },
  { week: 6, phase: "基礎固め", grammarRange: [66, 80], vocabTarget: 400, kanjiTarget: 120, focus: "週末模擬テスト" },
  { week: 7, phase: "強化", grammarRange: [81, 93], vocabTarget: 500, kanjiTarget: 150, focus: "長文読解" },
  { week: 8, phase: "強化", grammarRange: [94, 106], vocabTarget: 580, kanjiTarget: 180, focus: "聴解基礎" },
  { week: 9, phase: "強化", grammarRange: [107, 119], vocabTarget: 660, kanjiTarget: 210, focus: "文法応用" },
  { week: 10, phase: "強化", grammarRange: [120, 132], vocabTarget: 740, kanjiTarget: 240, focus: "読解速度" },
  { week: 11, phase: "強化", grammarRange: [133, 145], vocabTarget: 800, kanjiTarget: 270, focus: "弱点補強" },
  { week: 12, phase: "強化", grammarRange: [146, 160], vocabTarget: 800, kanjiTarget: 300, focus: "中間模擬試験" },
  { week: 13, phase: "強化", grammarRange: [161, 170], vocabTarget: 900, kanjiTarget: 310, focus: "N2語彙集中" },
  { week: 14, phase: "強化", grammarRange: [171, 180], vocabTarget: 1000, kanjiTarget: 320, focus: "読解演習" },
  { week: 15, phase: "実戦", grammarRange: [181, 188], vocabTarget: 1050, kanjiTarget: 330, focus: "聴解強化" },
  { week: 16, phase: "実戦", grammarRange: [189, 194], vocabTarget: 1100, kanjiTarget: 340, focus: "模擬問題" },
  { week: 17, phase: "実戦", grammarRange: [195, 198], vocabTarget: 1150, kanjiTarget: 350, focus: "総合演習" },
  { week: 18, phase: "実戦", grammarRange: [199, 200], vocabTarget: 1200, kanjiTarget: 360, focus: "模擬試験" },
  { week: 19, phase: "実戦", grammarRange: [199, 200], vocabTarget: 1250, kanjiTarget: 365, focus: "錯題復習" },
  { week: 20, phase: "実戦", grammarRange: [199, 200], vocabTarget: 1300, kanjiTarget: 370, focus: "聴解特訓" },
  { week: 21, phase: "直前対策", grammarRange: [199, 200], vocabTarget: 1400, kanjiTarget: 370, focus: "週1模擬試験" },
  { week: 22, phase: "直前対策", grammarRange: [199, 200], vocabTarget: 1450, kanjiTarget: 370, focus: "弱点集中" },
  { week: 23, phase: "直前対策", grammarRange: [199, 200], vocabTarget: 1480, kanjiTarget: 370, focus: "模擬試験" },
  { week: 24, phase: "直前対策", grammarRange: [199, 200], vocabTarget: 1500, kanjiTarget: 370, focus: "最終確認" },
  { week: 25, phase: "直前対策", grammarRange: [199, 200], vocabTarget: 1500, kanjiTarget: 370, focus: "模擬試験" },
  { week: 26, phase: "直前対策", grammarRange: [199, 200], vocabTarget: 1500, kanjiTarget: 370, focus: "試験直前" },
];

export function getCurrentWeek(startDate: string): number {
  const days = differenceInCalendarDays(new Date(), parseISO(startDate));
  return Math.min(26, Math.max(1, Math.ceil((days + 1) / 7)));
}

export function getWeekPlan(week: number): WeekPlan {
  return WEEKLY_PLAN[week - 1] ?? WEEKLY_PLAN[25];
}

export function compressPlan(week: number, vocabProgress: number, plan: WeekPlan): WeekPlan {
  const ratio = plan.vocabTarget > 0 ? vocabProgress / plan.vocabTarget : 1;
  if (ratio >= 0.85 || week < 8) return plan;
  return {
    ...plan,
    focus: "核心語彙・文法に集中（計画圧縮）",
    vocabTarget: Math.min(plan.vocabTarget, vocabProgress + 50),
  };
}

export async function generateDailyTasks(): Promise<DailyTask[]> {
  const settings = await getSettings();
  const week = getCurrentWeek(settings.startDate);
  let plan = getWeekPlan(week);
  const vocabCards = await db.srsCards.where("cardType").equals("vocab").count();
  plan = compressPlan(week, vocabCards, plan);
  const dueCount = await getDueCount();
  const weakness = await getWeaknessScores();
  const reviewQueueCount = await getDueReviewCount();
  const tasks: DailyTask[] = [];

  if (!settings.placementCompleted) {
    tasks.push({
      id: "placement",
      type: "weakness",
      title: "初回診断テスト",
      description: "学習計画を最適化するため、まず診断テストを受けてください。",
      href: "/placement",
      priority: 100,
      estimatedMinutes: 45,
    });
    return tasks;
  }

  if (reviewQueueCount > 0) {
    tasks.push({
      id: "review-queue",
      type: "weakness",
      title: `復習キュー（${reviewQueueCount}問）`,
      description: "間違えた問題を復習します",
      href: "/review",
      priority: 92,
      estimatedMinutes: reviewQueueCount * 2,
    });
  }

  if (dueCount > 0) {
    tasks.push({
      id: "srs-review",
      type: "srs",
      title: `SRS復習（${dueCount}枚）`,
      description: "期限が来た単語・漢字カードを復習します。",
      href: "/vocab/review",
      priority: 95,
      estimatedMinutes: Math.min(30, dueCount * 0.5),
    });
  }

  tasks.push({
    id: "vocab-new",
    type: "srs",
    title: "新しい単語",
    description: `今週の目標: ${plan.vocabTarget}語`,
    href: "/vocab",
    priority: 80,
    estimatedMinutes: 15,
  });

  tasks.push({
    id: "kanji-new",
    type: "srs",
    title: "漢字学習",
    description: `今週の目標: ${plan.kanjiTarget}字`,
    href: "/kanji",
    priority: 75,
    estimatedMinutes: 10,
  });

  const grammarStart = plan.grammarRange[0];
  tasks.push({
    id: "grammar-lesson",
    type: "grammar",
    title: "文法レッスン",
    description: `文法 #${grammarStart}〜#${plan.grammarRange[1]}（${plan.phase}）`,
    href: `/grammar/g${String(grammarStart).padStart(3, "0")}`,
    priority: 70,
    estimatedMinutes: 20,
  });

  const placementBoost = settings.placementScores
    ? Object.entries(settings.placementScores).filter(([, s]) => s < 50).map(([k]) => k as SkillTag)
    : [];
  const weakest = (Object.entries(weakness).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "reading") as SkillTag;
  const targetWeak = placementBoost.includes(weakest) ? weakest : placementBoost[0] ?? weakest;

  const weaknessPriority = computePriority(weakness[targetWeak], 1.5, targetWeak);
  const weaknessRoutes: Record<SkillTag, string> = {
    vocab: "/vocab",
    kanji: "/kanji",
    grammar: "/grammar",
    reading: "/reading",
    listening: "/listening",
  };

  tasks.push({
    id: `weakness-${targetWeak}`,
    type: "weakness",
    title: `弱点練習: ${targetWeak}`,
    description: placementBoost.length > 0 ? "診断結果に基づく優先練習" : "診断結果に基づく推奨練習",
    href: weaknessRoutes[targetWeak],
    priority: weaknessPriority,
    estimatedMinutes: 15,
  });

  if (week >= 4) {
    tasks.push({
      id: "reading-practice",
      type: "reading",
      title: "読解練習",
      description: "計時モードで長文読解",
      href: "/reading",
      priority: 65,
      estimatedMinutes: 25,
    });
  }

  if (week >= 8) {
    tasks.push({
      id: "listening-practice",
      type: "listening",
      title: "聴解練習",
      description: "N2形式の聴解問題",
      href: "/listening",
      priority: 60,
      estimatedMinutes: 20,
    });
  }

  if (week >= 6 && new Date().getDay() === 0) {
    tasks.push({
      id: "mock-exam",
      type: "exam",
      title: "模擬試験",
      description: "JLPT N2形式の模擬試験",
      href: "/exam",
      priority: 90,
      estimatedMinutes: 155,
    });
  }

  return interleaveTasks(tasks.sort((a, b) => b.priority - a.priority));
}

function interleaveTasks(tasks: DailyTask[]): DailyTask[] {
  const core = tasks.filter((t) => t.priority >= 90);
  const rest = tasks.filter((t) => t.priority < 90);
  const buckets: Record<string, DailyTask[]> = { srs: [], grammar: [], reading: [], other: [] };
  for (const t of rest) {
    if (t.type === "srs") buckets.srs.push(t);
    else if (t.type === "grammar") buckets.grammar.push(t);
    else if (t.type === "reading" || t.type === "listening") buckets.reading.push(t);
    else buckets.other.push(t);
  }
  const mixed: DailyTask[] = [...core];
  const maxLen = Math.max(buckets.srs.length, buckets.grammar.length, buckets.reading.length, buckets.other.length);
  for (let i = 0; i < maxLen; i++) {
    for (const key of ["srs", "grammar", "reading", "other"] as const) {
      if (buckets[key][i]) mixed.push(buckets[key][i]);
    }
  }
  return mixed;
}

export function getStudyCalendar(startDate: string): { date: string; week: number }[] {
  const start = parseISO(startDate);
  return Array.from({ length: 182 }, (_, i) => {
    const date = addDays(start, i);
    return {
      date: date.toISOString().split("T")[0],
      week: Math.min(26, Math.ceil((i + 1) / 7)),
    };
  });
}
