"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress";
import { loadPlacement } from "@/lib/content/loader";
import { recordAttempt } from "@/lib/weakness/engine";
import { SKILL_LABELS } from "@/lib/weakness/engine";
import { getSettings, saveSettings } from "@/lib/db/local/schema";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingState } from "@/components/ui/loading-state";
import { formatTime } from "@/lib/exam/scoring";
import type { PlacementQuestion, SkillTag } from "@/lib/types";

export default function PlacementPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<PlacementQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [finished, setFinished] = useState(false);
  const [scores, setScores] = useState<Record<SkillTag, number>>({
    vocab: 0,
    kanji: 0,
    grammar: 0,
    reading: 0,
    listening: 0,
  });
  const [seconds, setSeconds] = useState(45 * 60);

  const q = questions[index];

  useEffect(() => {
    loadPlacement().then(setQuestions);
  }, []);

  useEffect(() => {
    if (finished) return;
    const t = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [finished]);

  const finish = useCallback(async () => {
    const skillTotals: Record<SkillTag, { correct: number; total: number }> = {
      vocab: { correct: 0, total: 0 },
      kanji: { correct: 0, total: 0 },
      grammar: { correct: 0, total: 0 },
      reading: { correct: 0, total: 0 },
      listening: { correct: 0, total: 0 },
    };

    for (const question of questions) {
      skillTotals[question.skill].total++;
      const correct = answers[question.id] === question.correctIndex;
      if (correct) skillTotals[question.skill].correct++;
      await recordAttempt(question.skill, correct, question.contentId);
    }

    const computed = Object.fromEntries(
      Object.entries(skillTotals).map(([skill, { correct, total }]) => [
        skill,
        Math.round((correct / Math.max(total, 1)) * 100),
      ])
    ) as Record<SkillTag, number>;

    setScores(computed);
    setFinished(true);

    const settings = await getSettings();
    await saveSettings({ ...settings, placementCompleted: true, placementScores: computed });
  }, [answers, questions]);

  useEffect(() => {
    if (seconds === 0 && !finished) finish();
  }, [seconds, finished, finish]);

  if (!q) {
    return (
      <MainLayout>
        <PageHeader title="初回診断テスト" />
        <LoadingState />
      </MainLayout>
    );
  }

  if (finished) {
    return (
      <MainLayout>
        <PageHeader title="診断結果" />
        <Card className="mb-6">
          <CardTitle className="mb-4">能力スコア</CardTitle>
          <div className="space-y-3">
            {(Object.entries(scores) as [SkillTag, number][]).map(([skill, score]) => (
              <div key={skill}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{SKILL_LABELS[skill]}</span>
                  <span>{score}点</span>
                </div>
                <ProgressBar value={score} />
              </div>
            ))}
          </div>
        </Card>
        <p className="mb-4 text-zinc-600">
          26週間の個人別学習計画が作成されました。ダッシュボードで今日のタスクを確認してください。
        </p>
        <Button onClick={() => router.push("/dashboard")}>
          ダッシュボードへ
        </Button>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageHeader
        title="初回診断テスト"
        actions={<span className="font-mono text-zinc-500">{formatTime(seconds)}</span>}
      />
      <ProgressBar value={index + 1} max={questions.length} className="mb-6" />
      <Card>
        <p className="mb-2 text-sm text-zinc-500">
          問題 {index + 1} / {questions.length} · {SKILL_LABELS[q.skill]}
        </p>
        <p className="mb-6 text-lg">{q.prompt}</p>
        <div className="grid gap-2">
          {q.options.map((opt, i) => (
            <Button
              key={i}
              variant={answers[q.id] === i ? "primary" : "outline"}
              className="justify-start"
              onClick={() => setAnswers({ ...answers, [q.id]: i })}
            >
              {opt}
            </Button>
          ))}
        </div>
        <div className="mt-6 flex gap-2">
          <Button
            variant="outline"
            disabled={index === 0}
            onClick={() => setIndex(index - 1)}
          >
            前へ
          </Button>
          {index < questions.length - 1 ? (
            <Button onClick={() => setIndex(index + 1)}>次へ</Button>
          ) : (
            <Button onClick={finish}>完了</Button>
          )}
        </div>
      </Card>
    </MainLayout>
  );
}
