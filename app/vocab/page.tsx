"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MainLayout } from "@/components/layout/main-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { VirtualList } from "@/components/ui/virtual-list";
import { Flashcard } from "@/components/srs/flashcard";
import { getImportedVocab } from "@/lib/import/parsers";
import {
  getVocabSlice,
  getVocabCount,
  getVocabByIds,
} from "@/lib/content/loader";
import { getDueCards, getNewCards, createCardsForContent } from "@/lib/srs/fsrs";
import { getSettings } from "@/lib/db/local/schema";
import { REVIEW_MODE_LABELS } from "@/lib/ui/labels";
import type { VocabEntry, ReviewMode } from "@/lib/types";

const MODES: ReviewMode[] = ["recognition", "recall", "cloze", "listening"];
const CHUNK = 100;

export default function VocabPage() {
  const [builtin, setBuiltin] = useState<VocabEntry[]>([]);
  const [imported, setImported] = useState<VocabEntry[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loadedCount, setLoadedCount] = useState(0);
  const [mode, setMode] = useState<"list" | "study" | "review">("list");
  const [reviewMode, setReviewMode] = useState<ReviewMode>("recognition");
  const [studyItems, setStudyItems] = useState<{ item: VocabEntry; cardId: string; mode?: ReviewMode }[]>([]);
  const [search, setSearch] = useState("");
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadMore = useCallback(async () => {
    const slice = await getVocabSlice(loadedCount, CHUNK);
    if (slice.length === 0) return;
    setBuiltin((prev) => [...prev, ...slice]);
    setLoadedCount((c) => c + slice.length);
  }, [loadedCount]);

  useEffect(() => {
    Promise.all([getVocabCount(), getVocabSlice(0, CHUNK), getImportedVocab()]).then(
      ([count, first, imp]) => {
        setTotalCount(count);
        setBuiltin(first);
        setLoadedCount(first.length);
        setImported(imp);
        setLoading(false);
      }
    );
  }, []);

  useEffect(() => {
    if (!loading && loadedCount < totalCount && loadedCount < 300) {
      loadMore();
    }
  }, [loading, loadedCount, totalCount, loadMore]);

  const vocabList = useMemo(() => {
    const seen = new Set<string>();
    const merged: VocabEntry[] = [];
    for (const v of [...builtin, ...imported]) {
      if (seen.has(v.word)) continue;
      seen.add(v.word);
      merged.push(v);
    }
    return merged;
  }, [builtin, imported]);

  const filtered = useMemo(() => {
    if (!search.trim()) return vocabList;
    const q = search.trim();
    return vocabList.filter(
      (v) => v.word.includes(q) || v.reading.includes(q) || v.meaning.includes(q)
    );
  }, [vocabList, search]);

  async function startNewStudy() {
    const settings = await getSettings();
    const ids = vocabList.map((v) => v.id);
    const newIds = await getNewCards("vocab", ids, settings.newCardsPerDay);
    const items = await getVocabByIds(newIds);
    if (items.length === 0) return;
    const study = await Promise.all(
      items.map(async (item) => {
        const cards = await createCardsForContent(item.id, "vocab", [reviewMode]);
        return { item, cardId: cards[0].id };
      })
    );
    setStudyItems(study);
    setIndex(0);
    setMode("study");
  }

  async function startReview() {
    const due = await getDueCards();
    const vocabDue = due.filter((c) => c.cardType === "vocab");
    const items = await getVocabByIds(vocabDue.map((c) => c.contentId));
    const study = vocabDue
      .map((card) => {
        const item = items.find((v) => v.id === card.contentId);
        return item ? { item, cardId: card.id, mode: card.reviewMode as ReviewMode } : null;
      })
      .filter(Boolean) as typeof studyItems;
    if (study.length === 0) return;
    setStudyItems(study);
    setIndex(0);
    setMode("review");
  }

  const current = studyItems[index];

  if (loading) {
    return (
      <MainLayout>
        <PageHeader title="単語学習" />
        <LoadingState />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageHeader
        title="単語学習"
        description={`N2 語彙 ${totalCount + imported.length}語（${loadedCount}語読込済）`}
        actions={
          <div className="flex flex-wrap gap-2">
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
            <Button onClick={startNewStudy}>新しい単語</Button>
            <Button variant="outline" onClick={startReview}>復習</Button>
            <Link
              href="/vocab/review"
              className="inline-flex items-center justify-center rounded-xl px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-brand-muted dark:text-zinc-400"
            >
              復習ページ
            </Link>
          </div>
        }
      />

      {(mode === "study" || mode === "review") && current ? (
        <div className="pb-safe">
          <p className="mb-4 text-center text-sm text-zinc-500">{index + 1} / {studyItems.length}</p>
          <Flashcard
            key={current.cardId}
            item={current.item}
            type="vocab"
            cardId={current.cardId}
            mode={mode === "review" ? (current.mode ?? "recognition") : reviewMode}
            onComplete={() => {
              if (index + 1 < studyItems.length) setIndex(index + 1);
              else setMode("list");
            }}
          />
        </div>
      ) : (mode === "study" || mode === "review") && studyItems.length === 0 ? (
        <EmptyState
          title="復習するカードがありません"
          description="新しい単語を学習するか、後でもう一度お試しください。"
          action={<Button onClick={() => setMode("list")}>一覧に戻る</Button>}
        />
      ) : (
        <div>
          <Input
            className="mb-4 max-w-md"
            placeholder="単語・読み・意味で検索"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {filtered.length === 0 ? (
            <EmptyState title="該当する単語がありません" description="別のキーワードで検索してください。" />
          ) : (
            <VirtualList
              items={filtered}
              estimateSize={76}
              renderItem={(v) => (
                <Card variant="compact" className="mb-2">
                  <p className="font-medium">{v.word}</p>
                  <p className="text-sm text-zinc-500">{v.reading}</p>
                  <p className="text-sm">{v.meaning}</p>
                </Card>
              )}
            />
          )}
          {loadedCount < totalCount && !search && (
            <Button className="mt-3" variant="outline" size="sm" onClick={loadMore}>
              さらに読み込む（{loadedCount}/{totalCount}）
            </Button>
          )}
        </div>
      )}
    </MainLayout>
  );
}
