"use client";

import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { ReviewQuestionCard } from "@/components/review/review-question-card";
import { resolveReviewItem } from "@/lib/content/review-resolver";
import { getDueReviews, completeReview } from "@/lib/weakness/review-queue";
import type { WrongAnswerQueueRecord } from "@/lib/db/local/schema";
import type { ResolvedReviewItem } from "@/lib/content/review-resolver";

export default function ReviewQueuePage() {
  const [items, setItems] = useState<WrongAnswerQueueRecord[]>([]);
  const [index, setIndex] = useState(0);
  const [resolved, setResolved] = useState<ResolvedReviewItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [answered, setAnswered] = useState(false);

  const current = items[index];

  useEffect(() => {
    getDueReviews().then((list) => {
      setItems(list);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!current) {
      setResolved(null);
      return;
    }
    setAnswered(false);
    resolveReviewItem(
      current.contentId,
      current.contentType,
      current.exerciseId
    ).then(setResolved);
  }, [current]);

  async function handleAnswer(passed: boolean) {
    if (!current || answered) return;
    setAnswered(true);
    await completeReview(current.id, passed);
  }

  function nextItem() {
    setIndex((i) => i + 1);
    setAnswered(false);
  }

  if (loading) {
    return (
      <MainLayout>
        <PageHeader title="復習キュー" />
        <LoadingState />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageHeader title="復習キュー" description="間違えた問題を復習します" />
      {!current ? (
        <EmptyState
          title="復習する問題がありません"
          description="模擬試験や練習の間違いは後日ここに表示されます。"
        />
      ) : !resolved ? (
        <Card>
          <p className="mb-2 text-sm text-zinc-500">
            {index + 1} / {items.length} · {current.skill}
          </p>
          <p className="text-zinc-500">コンテンツを読み込めませんでした: {current.contentId}</p>
          <Button className="mt-4" onClick={nextItem}>
            スキップ
          </Button>
        </Card>
      ) : (
        <div className="pb-safe">
          <p className="mb-4 text-sm text-zinc-500">
            {index + 1} / {items.length} · {current.skill} · {current.source}
          </p>
          <ReviewQuestionCard
            item={resolved}
            onAnswer={handleAnswer}
            skipEnqueue
          />
          {answered && (
            <Button className="mt-4" onClick={nextItem}>
              次の問題
            </Button>
          )}
        </div>
      )}
    </MainLayout>
  );
}
