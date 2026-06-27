"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { ProgressBar } from "@/components/ui/progress";
import { WeaknessRadar } from "@/components/dashboard/weakness-radar";
import { PassProbabilityChart } from "@/components/dashboard/pass-probability-chart";
import { WeaknessHeatmap } from "@/components/dashboard/weakness-heatmap";
import { StudyTimeChart } from "@/components/dashboard/study-time-chart";
import { useDashboard } from "@/hooks/use-dashboard";
import { getWeekPlan } from "@/lib/curriculum/schedule";
import { getWeaknessScores } from "@/lib/weakness/engine";
import { getDueReviewCount } from "@/lib/weakness/review-queue";
import { getLeechCards } from "@/lib/srs/fsrs";
import { db, getSettings } from "@/lib/db/local/schema";
import type { SkillTag } from "@/lib/types";

export default function DashboardPage() {
  const { tasks, dueCount, streak, week, loading } = useDashboard();
  const [weakness, setWeakness] = useState<Record<SkillTag, number>>({
    vocab: 0.5, kanji: 0.5, grammar: 0.5, reading: 0.5, listening: 0.5,
  });
  const [passProb, setPassProb] = useState(0);
  const [examHistory, setExamHistory] = useState<{ date: string; probability: number }[]>([]);
  const [reviewQueue, setReviewQueue] = useState(0);
  const [placementNote, setPlacementNote] = useState("");
  const [leechCount, setLeechCount] = useState(0);
  const plan = getWeekPlan(week);

  useEffect(() => {
    getWeaknessScores().then(setWeakness);
    getDueReviewCount().then(setReviewQueue);
    getLeechCards().then((c) => setLeechCount(c.length));
    db.examResults.orderBy("date").toArray().then((results) => {
      if (results.length > 0) {
        setPassProb(results[results.length - 1].passProbability);
        setExamHistory(results.map((r) => ({ date: r.date, probability: r.passProbability })));
      }
    });
    getSettings().then((s) => {
      if (s.placementScores) {
        const weak = Object.entries(s.placementScores)
          .sort((a, b) => a[1] - b[1])
          .slice(0, 2)
          .map(([k]) => k);
        setPlacementNote(`弱点強化: ${weak.join("・")}を優先`);
      }
    });
  }, []);

  if (loading) {
    return (
      <MainLayout>
        <PageHeader title="ダッシュボード" description="読み込み中..." />
        <LoadingState skeleton />
      </MainLayout>
    );
  }

  const inPassZone =
    examHistory.length >= 4 &&
    examHistory.slice(-4).every((e) => e.probability >= 0.7);

  const hasTasks = tasks.length > 0 || reviewQueue > 0;

  return (
    <MainLayout>
      <PageHeader
        title="ダッシュボード"
        description={`第${week}週 · ${plan.phase} · ${plan.focus}`}
      />
      {placementNote && (
        <p className="-mt-4 mb-4 text-sm text-brand-foreground">個人化された学習計画 — {placementNote}</p>
      )}

      {inPassZone && (
        <Card variant="success" className="mb-4">
          <p className="font-bold text-green-800 dark:text-green-200">合格圏内</p>
        </Card>
      )}

      {leechCount > 0 && (
        <Card variant="warning" className="mb-4">
          <p className="text-sm text-orange-800 dark:text-orange-200">
            難問カード（リーチ）: {leechCount}枚 — SRSで重点復習を
          </p>
        </Card>
      )}

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <p className="text-sm text-zinc-500">連続学習</p>
          <p className="text-3xl font-bold text-brand">{streak}日</p>
        </Card>
        <Card>
          <p className="text-sm text-zinc-500">復習待ち</p>
          <p className="text-3xl font-bold">{dueCount}枚</p>
        </Card>
        <Card>
          <p className="text-sm text-zinc-500">復習キュー</p>
          <p className="text-3xl font-bold">{reviewQueue}問</p>
        </Card>
        <Card>
          <p className="text-sm text-zinc-500">カリキュラム</p>
          <p className="text-3xl font-bold">{Math.round((week / 26) * 100)}%</p>
          <ProgressBar value={week} max={26} className="mt-2" />
        </Card>
        <Card>
          <p className="text-sm text-zinc-500">合格予測</p>
          <p className="text-3xl font-bold">{passProb > 0 ? `${Math.round(passProb * 100)}%` : "—"}</p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle className="mb-4">今日のタスク</CardTitle>
          <div className="space-y-3">
            <Link href="/review/mixed">
              <Card variant="interactive" className="border-brand/30 bg-brand-muted/50 dark:bg-brand-muted/30">
                <p className="font-medium">混合復習</p>
                <CardDescription>SRS + 錯題を交互に</CardDescription>
              </Card>
            </Link>
            {reviewQueue > 0 && (
              <Link href="/review">
                <Card variant="interactive" className="border-orange-200/80">
                  <p className="font-medium">復習キュー（{reviewQueue}問）</p>
                  <CardDescription>間違えた問題を復習</CardDescription>
                </Card>
              </Link>
            )}
            {tasks.map((task) => (
              <Link key={task.id} href={task.href}>
                <Card variant="interactive">
                  <div className="flex justify-between gap-2">
                    <div>
                      <p className="font-medium">{task.title}</p>
                      <CardDescription>{task.description}</CardDescription>
                    </div>
                    <span className="shrink-0 text-xs text-zinc-400">約{task.estimatedMinutes}分</span>
                  </div>
                </Card>
              </Link>
            ))}
            {!hasTasks && (
              <EmptyState
                title="今日のタスクは完了しました"
                description="お疲れさまでした。復習や模擬試験でさらに強化しましょう。"
              />
            )}
          </div>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardTitle className="mb-4">弱点分析</CardTitle>
            <WeaknessRadar scores={weakness} />
          </Card>
          <Card>
            <CardTitle className="mb-4">合格予測曲線</CardTitle>
            <PassProbabilityChart data={examHistory} />
          </Card>
          <Card>
            <CardTitle className="mb-4">累計学習時間</CardTitle>
            <StudyTimeChart />
          </Card>
          <Card>
            <CardTitle className="mb-4">弱点ヒートマップ</CardTitle>
            <WeaknessHeatmap />
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
