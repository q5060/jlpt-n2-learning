"use client";

import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { Flashcard } from "@/components/srs/flashcard";
import { ReviewQuestionCard } from "@/components/review/review-question-card";
import { resolveReviewItem } from "@/lib/content/review-resolver";
import { getDueCards } from "@/lib/srs/fsrs";
import { getVocabByIds, getKanjiByIds } from "@/lib/content/loader";
import { getDueReviews, completeReview } from "@/lib/weakness/review-queue";
import type { ResolvedReviewItem } from "@/lib/content/review-resolver";
import type { KanjiEntry, VocabEntry, ReviewMode } from "@/lib/types";
import type { WrongAnswerQueueRecord, SRSCardRecord } from "@/lib/db/local/schema";

type MixedItem =
  | { kind: "srs"; item: VocabEntry | KanjiEntry; cardId: string; type: "vocab" | "kanji"; reviewMode: string }
  | { kind: "wrong"; queue: WrongAnswerQueueRecord; resolved: ResolvedReviewItem };

export default function MixedReviewPage() {
  const [items, setItems] = useState<MixedItem[]>([]);
  const [index, setIndex] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [due, wrong] = await Promise.all([getDueCards(20), getDueReviews()]);
      const vocabIds = due.filter((c) => c.cardType === "vocab").map((c) => c.contentId);
      const kanjiIds = due.filter((c) => c.cardType === "kanji").map((c) => c.contentId);
      const [vocabList, kanjiList] = await Promise.all([
        getVocabByIds(vocabIds),
        getKanjiByIds(kanjiIds),
      ]);
      const vocabMap = new Map(vocabList.map((v) => [v.id, v]));
      const kanjiMap = new Map(kanjiList.map((k) => [k.id, k]));

      const srsItems: MixedItem[] = due
        .map((card: SRSCardRecord) => {
          if (card.cardType === "vocab") {
            const item = vocabMap.get(card.contentId);
            return item ? { kind: "srs" as const, item, cardId: card.id, type: "vocab" as const, reviewMode: card.reviewMode } : null;
          }
          const item = kanjiMap.get(card.contentId);
          return item ? { kind: "srs" as const, item, cardId: card.id, type: "kanji" as const, reviewMode: card.reviewMode } : null;
        })
        .filter(Boolean) as MixedItem[];

      const wrongItems: MixedItem[] = [];
      for (const w of wrong.slice(0, 10)) {
        const resolved = await resolveReviewItem(w.contentId, w.contentType, w.exerciseId);
        if (resolved) wrongItems.push({ kind: "wrong", queue: w, resolved });
      }

      const mixed: MixedItem[] = [];
      const max = Math.max(srsItems.length, wrongItems.length);
      for (let i = 0; i < max; i++) {
        if (srsItems[i]) mixed.push(srsItems[i]);
        if (wrongItems[i]) mixed.push(wrongItems[i]);
      }
      setItems(mixed);
      setLoading(false);
    }
    load();
  }, []);

  const current = items[index];

  async function handleWrongAnswer(passed: boolean) {
    if (current?.kind !== "wrong" || answered) return;
    setAnswered(true);
    await completeReview(current.queue.id, passed);
  }

  function next() {
    setIndex((i) => i + 1);
    setAnswered(false);
  }

  if (loading) {
    return (
      <MainLayout>
        <PageHeader title="混合復習" />
        <LoadingState />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageHeader title="混合復習" description="SRS と錯題を交互に復習" />
      {!current ? (
        <EmptyState title="復習項目がありません" description="単語や文法を学習すると、ここに復習項目が表示されます。" />
      ) : (
        <div className="pb-safe">
          <p className="mb-4 text-sm text-zinc-500">
            {index + 1} / {items.length} · {current.kind === "srs" ? "SRS" : "錯題"}
          </p>
          {current.kind === "srs" ? (
            <Flashcard
              item={current.item}
              type={current.type}
              cardId={current.cardId}
              mode={(current.reviewMode as ReviewMode) || "recognition"}
              onComplete={next}
            />
          ) : (
            <>
              <ReviewQuestionCard item={current.resolved} onAnswer={handleWrongAnswer} skipEnqueue />
              {answered && <Button className="mt-4" onClick={next}>次へ</Button>}
            </>
          )}
        </div>
      )}
    </MainLayout>
  );
}
