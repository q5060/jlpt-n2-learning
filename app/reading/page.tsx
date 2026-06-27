"use client";

import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { ReadingTimer } from "@/components/listening/audio-player";
import { TokenizedPassage } from "@/components/reading/tokenized-passage";
import { getReadingMeta, getReadingById } from "@/lib/content/loader";
import { recordAttempt } from "@/lib/weakness/engine";
import { db } from "@/lib/db/local/schema";
import type { ReadingPassage } from "@/lib/types";

type ReadingMeta = Pick<ReadingPassage, "id" | "title" | "level" | "timeLimitMinutes">;

export default function ReadingListPage() {
  const [readingList, setReadingList] = useState<ReadingMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [passage, setPassage] = useState<ReadingPassage | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [timerRunning, setTimerRunning] = useState(false);

  useEffect(() => {
    getReadingMeta().then((list) => {
      setReadingList(list);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!activeId) {
      setPassage(null);
      return;
    }
    getReadingById(activeId).then((p) => setPassage(p ?? null));
  }, [activeId]);

  async function submit() {
    if (!passage) return;
    let correct = 0;
    for (const q of passage.questions) {
      const isCorrect = answers[q.id] === q.correctIndex;
      if (isCorrect) correct++;
      await recordAttempt("reading", isCorrect, q.id);
    }
    await db.progress.put({
      id: `reading-${passage.id}`,
      contentType: "reading",
      contentId: passage.id,
      completed: true,
      score: correct / passage.questions.length,
      completedAt: Date.now(),
    });
    setSubmitted(true);
    setTimerRunning(false);
  }

  function goBack() {
    setActiveId(null);
    setPassage(null);
    setSubmitted(false);
    setAnswers({});
    setTimerRunning(false);
  }

  if (passage) {
    return (
      <MainLayout>
        <Button variant="ghost" className="mb-4" onClick={goBack}>← 一覧に戻る</Button>
        <PageHeader
          title={passage.title}
          actions={
            <ReadingTimer minutes={passage.timeLimitMinutes} running={timerRunning} onTimeUp={submit} />
          }
        />
        {!timerRunning && !submitted && (
          <Button className="mb-4" onClick={() => setTimerRunning(true)}>計時開始</Button>
        )}
        <Card className="mb-6">
          <TokenizedPassage content={passage.content} />
        </Card>
        <div className="space-y-4">
          {passage.questions.map((q) => (
            <Card key={q.id}>
              <p className="mb-3 font-medium">{q.question}</p>
              <div className="grid gap-2">
                {q.options.map((opt, i) => (
                  <Button
                    key={i}
                    variant={answers[q.id] === i ? "primary" : "outline"}
                    className="justify-start text-left"
                    onClick={() => setAnswers({ ...answers, [q.id]: i })}
                    disabled={submitted}
                  >
                    {i + 1}. {opt}
                  </Button>
                ))}
              </div>
              {submitted && (
                <div className="mt-3 rounded-xl bg-zinc-100 p-3 text-sm dark:bg-zinc-800">
                  <p>{answers[q.id] === q.correctIndex ? "正解" : "不正解"}{q.trapType && ` · ${q.trapType}`}</p>
                  <p className="mt-1 text-zinc-500">{q.explanation}</p>
                </div>
              )}
            </Card>
          ))}
        </div>
        {!submitted && timerRunning && <Button className="mt-6" onClick={submit}>提出</Button>}
      </MainLayout>
    );
  }

  if (loading) {
    return (
      <MainLayout>
        <PageHeader title="読解練習" />
        <LoadingState />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageHeader
        title="読解練習"
        description={`${readingList.length} 篇 · 単語をクリックして意味を確認`}
      />
      {readingList.length === 0 ? (
        <EmptyState title="読解教材がありません" description="コンテンツを生成してください。" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {readingList.map((r) => (
            <Card key={r.id} variant="interactive" onClick={() => setActiveId(r.id)}>
              <p className="font-medium">{r.title}</p>
              <p className="text-sm text-zinc-500">{r.level} · {r.timeLimitMinutes}分</p>
            </Card>
          ))}
        </div>
      )}
    </MainLayout>
  );
}
