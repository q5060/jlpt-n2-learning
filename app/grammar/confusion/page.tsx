"use client";

import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingState } from "@/components/ui/loading-state";
import { GrammarExerciseCard } from "@/components/grammar/exercise-card";
import { loadConfusionPairs, loadGrammar } from "@/lib/content/loader";

export default function ConfusionPage() {
  const [pairs, setPairs] = useState<Awaited<ReturnType<typeof loadConfusionPairs>>>([]);
  const [grammar, setGrammar] = useState<Awaited<ReturnType<typeof loadGrammar>>>([]);
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([loadConfusionPairs(), loadGrammar()]).then(([p, g]) => {
      setPairs(p);
      setGrammar(g);
      setLoading(false);
    });
  }, []);

  const pair = pairs[idx];
  const related = grammar.filter(
    (g) => g.pattern.includes(pair?.a.split("〜")[0] ?? "") || g.pattern.includes(pair?.b.split("〜")[0] ?? "")
  ).slice(0, 1);

  if (loading) {
    return (
      <MainLayout>
        <PageHeader title="類似文法の比較練習" />
        <LoadingState />
      </MainLayout>
    );
  }

  if (!pair) {
    return (
      <MainLayout>
        <PageHeader title="類似文法の比較練習" />
        <p className="text-zinc-500">データがありません</p>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageHeader title="類似文法の比較練習" description={`${idx + 1} / ${pairs.length}`} />
      <Card className="mb-6">
        <CardTitle className="mb-2">{pair.a} vs {pair.b}</CardTitle>
        <p className="text-zinc-600 dark:text-zinc-400">{pair.difference}</p>
      </Card>
      {related[0]?.exercises.slice(0, 2).map((ex) => (
        <div key={ex.id} className="mb-4">
          <GrammarExerciseCard exercise={ex} grammarId={related[0].id} />
        </div>
      ))}
      <div className="flex gap-2">
        <Button variant="outline" disabled={idx === 0} onClick={() => setIdx(idx - 1)}>前へ</Button>
        <Button disabled={idx >= pairs.length - 1} onClick={() => setIdx(idx + 1)}>次へ</Button>
      </div>
    </MainLayout>
  );
}
