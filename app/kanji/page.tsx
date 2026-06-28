"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { MainLayout } from "@/components/layout/main-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { VirtualList } from "@/components/ui/virtual-list";
import { Flashcard } from "@/components/srs/flashcard";
import { getKanjiSlice, getKanjiCount, getKanjiByIds } from "@/lib/content/loader";
import { getNewCards, getDueCards, createCardsForContent } from "@/lib/srs/fsrs";
import { getSettings } from "@/lib/db/local/schema";
import { REVIEW_MODE_LABELS, NAV_LABELS } from "@/lib/ui/labels";
import type { KanjiEntry, ReviewMode } from "@/lib/types";

const CHUNK = 50;
const MODES: ReviewMode[] = ["recognition", "recall"];

export default function KanjiPage() {
  const [kanjiList, setKanjiList] = useState<KanjiEntry[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loadedCount, setLoadedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [reviewMode, setReviewMode] = useState<ReviewMode>("recognition");
  const [studying, setStudying] = useState(false);
  const [items, setItems] = useState<{ item: KanjiEntry; cardId: string; mode: ReviewMode }[]>([]);
  const [index, setIndex] = useState(0);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadMore = useCallback(async () => {
    const slice = await getKanjiSlice(loadedCount, CHUNK);
    if (slice.length === 0) return;
    setKanjiList((prev) => [...prev, ...slice]);
    setLoadedCount((c) => c + slice.length);
  }, [loadedCount]);

  useEffect(() => {
    Promise.all([getKanjiCount(), getKanjiSlice(0, CHUNK)]).then(([count, first]) => {
      setTotalCount(count);
      setKanjiList(first);
      setLoadedCount(first.length);
      setLoading(false);
    });
  }, []);

  async function startStudy() {
    setActionMessage(null);
    const settings = await getSettings();
    const newIds = await getNewCards(
      "kanji",
      kanjiList.map((k) => k.id),
      Math.min(10, settings.newCardsPerDay)
    );
    const entries = await getKanjiByIds(newIds);
    if (entries.length === 0) {
      setActionMessage("今日の新規漢字はありません。");
      return;
    }
    const loaded = await Promise.all(
      entries.map(async (item) => {
        const cards = await createCardsForContent(item.id, "kanji", [reviewMode]);
        return { item, cardId: cards[0].id, mode: reviewMode };
      })
    );
    setItems(loaded);
    setIndex(0);
    setStudying(true);
  }

  async function startReview() {
    setActionMessage(null);
    const due = await getDueCards();
    const kanjiDue = due.filter((c) => c.cardType === "kanji");
    const entries = await getKanjiByIds(kanjiDue.map((c) => c.contentId));
    const loaded = kanjiDue
      .map((card) => {
        const item = entries.find((k) => k.id === card.contentId);
        return item
          ? { item, cardId: card.id, mode: card.reviewMode as ReviewMode }
          : null;
      })
      .filter(Boolean) as typeof items;
    if (loaded.length === 0) {
      setActionMessage("復習待ちの漢字がありません。");
      return;
    }
    setItems(loaded);
    setIndex(0);
    setStudying(true);
  }

  const current = items[index];

  if (loading) {
    return (
      <MainLayout>
        <PageHeader title="漢字学習" />
        <LoadingState />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageHeader
        title="漢字学習"
        description={`N2 漢字 ${totalCount}字`}
        toolbar={
          <>
            {MODES.map((m) => (
              <Button
                key={m}
                size="sm"
                variant={reviewMode === m ? "primary" : "outline"}
                onClick={() => setReviewMode(m)}
              >
                {REVIEW_MODE_LABELS[m]}
              </Button>
            ))}
          </>
        }
        actions={
          <>
            <Button onClick={startStudy}>学習開始</Button>
            <Button variant="outline" onClick={startReview}>
              復習
            </Button>
            <Link
              href="/vocab/review"
              className="inline-flex items-center justify-center rounded-xl px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-brand-muted dark:text-zinc-400"
            >
              {NAV_LABELS.vocabReview}
            </Link>
          </>
        }
      />

      {actionMessage && (
        <Card variant="warning" className="mb-4">
          <p className="text-sm">{actionMessage}</p>
        </Card>
      )}

      {studying && current ? (
        <div className="pb-safe">
          <p className="mb-4 text-center text-sm text-zinc-500">{index + 1} / {items.length}</p>
          <Flashcard
            key={current.cardId}
            item={current.item}
            type="kanji"
            cardId={current.cardId}
            mode={current.mode}
            onComplete={() => {
              if (index + 1 < items.length) setIndex(index + 1);
              else setStudying(false);
            }}
          />
        </div>
      ) : studying && items.length === 0 ? (
        <EmptyState
          title="学習する漢字がありません"
          description="新規カードの上限に達している可能性があります。"
          action={<Button onClick={() => setStudying(false)}>一覧に戻る</Button>}
        />
      ) : (
        <>
          <VirtualList
            items={kanjiList}
            estimateSize={64}
            renderItem={(k) => (
              <Card variant="compact" className="mb-2 flex items-center gap-4">
                <span className="text-3xl font-bold">{k.character}</span>
                <div>
                  <p className="text-sm">{k.onyomi.join("・")} / {k.kunyomi.join("・")}</p>
                  <p className="text-xs text-zinc-500">{k.meaning}</p>
                </div>
              </Card>
            )}
          />
          {loadedCount < totalCount && (
            <Button className="mt-3" variant="outline" size="sm" onClick={loadMore}>
              さらに読み込む（{loadedCount}/{totalCount}）
            </Button>
          )}
        </>
      )}
    </MainLayout>
  );
}
