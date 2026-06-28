"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { SessionComplete } from "@/components/ui/session-complete";
import { NAV_LABELS } from "@/lib/ui/labels";
import { SKILL_LABELS } from "@/lib/weakness/engine";
import { ReviewQuestionCard } from "@/components/review/review-question-card";
import { resolveReviewItem } from "@/lib/content/review-resolver";
import { getDueReviews, completeReview } from "@/lib/weakness/review-queue";
import type { WrongAnswerQueueRecord } from "@/lib/db/local/schema";
import type { ResolvedReviewItem } from "@/lib/content/review-resolver";

function ReviewItemPanel({
  current,
  index,
  total,
  onNext,
}: {
  current: WrongAnswerQueueRecord;
  index: number;
  total: number;
  onNext: () => void;
}) {
  const [resolved, setResolved] = useState<ResolvedReviewItem | null>(null);
  const [answered, setAnswered] = useState(false);

  useEffect(() => {
    resolveReviewItem(
      current.contentId,
      current.contentType,
      current.exerciseId
    ).then(setResolved);
  }, [current.contentId, current.contentType, current.exerciseId]);

  async function handleAnswer(passed: boolean) {
    if (answered) return;
    setAnswered(true);
    await completeReview(current.id, passed);
  }

  if (!resolved) {
    return (
      <ErrorState
        title="コンテンツを読み込めませんでした"
        description={`ID: ${current.contentId}`}
        action={<Button onClick={onNext}>スキップ</Button>}
        className="py-8"
      />
    );
  }

  return (
    <div className="pb-safe">
      <p className="mb-4 text-sm text-zinc-500">
        {index + 1} / {total} · {current.skill} · {current.source}
      </p>
      <ReviewQuestionCard item={resolved} onAnswer={handleAnswer} skipEnqueue />
      {answered && (
        <Button className="mt-4" onClick={onNext}>
          次の問題
        </Button>
      )}
    </div>
  );
}

function ReviewQueueContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const skillFilter = searchParams.get("skill");
  const contentIdFilter = searchParams.get("contentId");
  const [items, setItems] = useState<WrongAnswerQueueRecord[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const current = items[index];
  const sessionDone = items.length > 0 && index >= items.length;
  const hasFilters = Boolean(skillFilter || contentIdFilter);

  useEffect(() => {
    getDueReviews().then((list) => {
      let filtered = list;
      if (skillFilter) {
        filtered = filtered.filter((item) => item.skill === skillFilter);
      }
      if (contentIdFilter) {
        filtered = filtered.filter((item) => item.contentId === contentIdFilter);
      }
      setItems(filtered);
      setIndex(0);
      setLoading(false);
    });
  }, [skillFilter, contentIdFilter]);

  function nextItem() {
    setIndex((i) => i + 1);
  }

  function clearFilters() {
    router.push("/review");
  }

  if (loading) {
    return (
      <MainLayout>
        <PageHeader title={NAV_LABELS.reviewQueue} />
        <LoadingState />
      </MainLayout>
    );
  }

  const descriptionParts: string[] = [];
  if (skillFilter && skillFilter in SKILL_LABELS) {
    descriptionParts.push(`${SKILL_LABELS[skillFilter as keyof typeof SKILL_LABELS]} の間違い`);
  }
  if (contentIdFilter) {
    descriptionParts.push(`ID: ${contentIdFilter}`);
  }

  return (
    <MainLayout>
      <PageHeader
        title={NAV_LABELS.reviewQueue}
        description={
          descriptionParts.length > 0
            ? descriptionParts.join(" · ")
            : "間違えた問題を復習します"
        }
        actions={
          hasFilters ? (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              フィルタ解除
            </Button>
          ) : undefined
        }
      />
      {sessionDone ? (
        <SessionComplete
          title="復習完了"
          stats={`${items.length}問`}
          primaryAction={
            <Link href="/dashboard">
              <Button>ダッシュボードへ</Button>
            </Link>
          }
        />
      ) : !current ? (
        <EmptyState
          title={
            hasFilters
              ? "該当する復習問題がありません"
              : "復習する問題がありません"
          }
          description={
            hasFilters
              ? "期限が来ていないか、既に復習済みの可能性があります。"
              : "模擬試験や練習の間違いは後日ここに表示されます。"
          }
          action={
            hasFilters ? (
              <Button variant="outline" onClick={clearFilters}>
                フィルタ解除
              </Button>
            ) : undefined
          }
        />
      ) : (
        <ReviewItemPanel
          key={current.id}
          current={current}
          index={index}
          total={items.length}
          onNext={nextItem}
        />
      )}
    </MainLayout>
  );
}

export default function ReviewQueuePage() {
  return (
    <Suspense
      fallback={
        <MainLayout>
          <PageHeader title={NAV_LABELS.reviewQueue} />
          <LoadingState />
        </MainLayout>
      }
    >
      <ReviewQueueContent />
    </Suspense>
  );
}
