"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MainLayout } from "@/components/layout/main-layout";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { SessionComplete } from "@/components/ui/session-complete";
import { Button } from "@/components/ui/button";
import { Flashcard } from "@/components/srs/flashcard";
import { getVocabByIds, getKanjiByIds } from "@/lib/content/loader";
import { getDueCards } from "@/lib/srs/fsrs";
import { NAV_LABELS } from "@/lib/ui/labels";
import type { KanjiEntry, VocabEntry, ReviewMode } from "@/lib/types";

export default function VocabReviewPage() {
  const [items, setItems] = useState<
    { item: VocabEntry | KanjiEntry; cardId: string; type: "vocab" | "kanji"; reviewMode: string }[]
  >([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const due = await getDueCards();
      const vocabIds = due.filter((c) => c.cardType === "vocab").map((c) => c.contentId);
      const kanjiIds = due.filter((c) => c.cardType === "kanji").map((c) => c.contentId);
      const [vocabList, kanjiList] = await Promise.all([
        getVocabByIds(vocabIds),
        getKanjiByIds(kanjiIds),
      ]);
      const vocabMap = new Map(vocabList.map((v) => [v.id, v]));
      const kanjiMap = new Map(kanjiList.map((k) => [k.id, k]));
      const loaded = due
        .map((card) => {
          if (card.cardType === "vocab") {
            const item = vocabMap.get(card.contentId);
            return item ? { item, cardId: card.id, type: "vocab" as const, reviewMode: card.reviewMode } : null;
          }
          const item = kanjiMap.get(card.contentId);
          return item ? { item, cardId: card.id, type: "kanji" as const, reviewMode: card.reviewMode } : null;
        })
        .filter(Boolean) as typeof items;
      setItems(loaded);
      setLoading(false);
    }
    load();
  }, []);

  const current = items[index];
  const sessionDone = items.length > 0 && index >= items.length;

  if (loading) {
    return (
      <MainLayout>
        <PageHeader title={NAV_LABELS.vocabReview} />
        <LoadingState />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageHeader title={NAV_LABELS.vocabReview} description="期限が来たカードを復習します" />
      {sessionDone ? (
        <SessionComplete
          title="復習完了"
          stats={`${items.length}枚`}
          description="お疲れさまでした。ダッシュボードで進捗を確認できます。"
          primaryAction={
            <Link href="/dashboard">
              <Button>ダッシュボードへ</Button>
            </Link>
          }
          secondaryAction={
            <Link href="/vocab">
              <Button variant="outline">単語一覧へ</Button>
            </Link>
          }
        />
      ) : !current ? (
        <EmptyState title="復習するカードがありません" description="新しい単語を学習すると、ここに表示されます。" />
      ) : (
        <div className="pb-safe">
          <p className="mb-4 text-center text-sm text-zinc-500">{index + 1} / {items.length}</p>
          <Flashcard
            key={current.cardId}
            item={current.item}
            type={current.type}
            cardId={current.cardId}
            mode={(current.reviewMode as ReviewMode) || "recognition"}
            onComplete={() => setIndex((i) => i + 1)}
          />
        </div>
      )}
    </MainLayout>
  );
}
