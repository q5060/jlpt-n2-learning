"use client";

import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { BackLink } from "@/components/ui/back-link";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { AudioPlayer } from "@/components/listening/audio-player";
import { loadListening } from "@/lib/content/loader";
import { recordAttempt } from "@/lib/weakness/engine";
import type { ListeningItem } from "@/lib/types";

const typeLabels = {
  task: "課題理解",
  point: "ポイント理解",
  overview: "概要理解",
  instant: "即時応答",
};

const PAGE_SIZE = 30;

export default function ListeningPage() {
  const [listeningList, setListeningList] = useState<ListeningItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [scoreSummary, setScoreSummary] = useState<{ correct: number; total: number } | null>(null);
  const [examMode, setExamMode] = useState(false);

  useEffect(() => {
    loadListening().then((list) => {
      setListeningList(list);
      setLoading(false);
    });
  }, []);

  const item = activeId ? listeningList.find((l) => l.id === activeId) : null;
  const totalPages = Math.ceil(listeningList.length / PAGE_SIZE);
  const slice = listeningList.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  async function submit() {
    if (!item) return;
    let correct = 0;
    for (const q of item.questions) {
      const isCorrect = answers[q.id] === q.correctIndex;
      if (isCorrect) correct++;
      await recordAttempt("listening", isCorrect, q.id);
    }
    setScoreSummary({ correct, total: item.questions.length });
    setSubmitted(true);
  }

  function goBack() {
    setActiveId(null);
    setSubmitted(false);
    setScoreSummary(null);
    setAnswers({});
    setExamMode(false);
    setPage(0);
  }

  if (item) {
    return (
      <MainLayout>
        <BackLink onClick={goBack} label="一覧に戻る" />
        <PageHeader title={item.title} description={typeLabels[item.type]} />
        <div className="mb-4 flex gap-2">
          <Button variant={examMode ? "primary" : "outline"} size="sm" onClick={() => setExamMode(true)}>試験モード</Button>
          <Button variant={!examMode ? "primary" : "outline"} size="sm" onClick={() => setExamMode(false)}>練習モード</Button>
        </div>
        <AudioPlayer src={item.audioUrl} examMode={examMode} transcript={item.transcript} />
        <div className="mt-6 space-y-4">
          {item.questions.map((q) => (
            <Card key={q.id}>
              <p className="mb-3">{q.question}</p>
              <div className="grid gap-2">
                {q.options.map((opt, i) => {
                  const selected = answers[q.id] === i;
                  const isCorrect = i === q.correctIndex;
                  let variant: "primary" | "outline" | "secondary" | "danger" = selected ? "primary" : "outline";
                  if (submitted) {
                    if (isCorrect) variant = "secondary";
                    else if (selected && !isCorrect) variant = "danger";
                    else variant = "outline";
                  }
                  return (
                    <Button
                      key={i}
                      variant={variant}
                      className="justify-start"
                      onClick={() => setAnswers({ ...answers, [q.id]: i })}
                      disabled={submitted}
                    >
                      {opt}
                    </Button>
                  );
                })}
              </div>
              {submitted && (
                <div className="mt-3 rounded-xl bg-zinc-100 p-3 text-sm dark:bg-zinc-800">
                  <p>{answers[q.id] === q.correctIndex ? "正解" : "不正解"}</p>
                  <p className="mt-1 text-zinc-500">{q.explanation}</p>
                </div>
              )}
            </Card>
          ))}
        </div>
        {!submitted && <Button className="mt-4" onClick={submit}>確認</Button>}
        {submitted && scoreSummary && (
          <Card variant="success" className="mt-4">
            <CardTitle className="mb-1">結果</CardTitle>
            <p className="text-lg font-semibold">
              正解 {scoreSummary.correct} / {scoreSummary.total}
            </p>
          </Card>
        )}
        {submitted && (
          <Card className="mt-4">
            <CardTitle className="mb-2">書き起こし</CardTitle>
            <p className="text-sm">{item.transcript}</p>
          </Card>
        )}
      </MainLayout>
    );
  }

  if (loading) {
    return (
      <MainLayout>
        <PageHeader title="聴解練習" />
        <LoadingState />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageHeader title="聴解練習" description={`${listeningList.length} 問`} />
      {listeningList.length === 0 ? (
        <EmptyState title="聴解教材がありません" description="音源パックを設定からダウンロードできます。" />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {slice.map((l) => (
              <Card key={l.id} variant="interactive" onClick={() => setActiveId(l.id)}>
                <p className="font-medium">{l.title}</p>
                <p className="text-sm text-zinc-500">{typeLabels[l.type]}</p>
              </Card>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)}>前へ</Button>
            <span className="flex items-center text-sm">{page + 1} / {totalPages}</span>
            <Button size="sm" variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>次へ</Button>
          </div>
        </>
      )}
    </MainLayout>
  );
}
