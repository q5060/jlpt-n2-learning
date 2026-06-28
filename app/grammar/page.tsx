"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingState } from "@/components/ui/loading-state";
import { WeekFilter } from "@/components/ui/week-filter";
import { VirtualList } from "@/components/ui/virtual-list";
import { getGrammarListMeta, type GrammarMeta } from "@/lib/content/loader";

function GrammarListContent() {
  const searchParams = useSearchParams();
  const [grammarList, setGrammarList] = useState<GrammarMeta[]>([]);
  const [weekFilter, setWeekFilter] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const urlWeek = searchParams.get("week");
  const effectiveWeekFilter =
    weekFilter ?? (urlWeek ? Number(urlWeek) : null);

  useEffect(() => {
    getGrammarListMeta().then((g) => {
      setGrammarList(g);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(
    () =>
      effectiveWeekFilter
        ? grammarList.filter((g) => g.week === effectiveWeekFilter)
        : grammarList,
    [grammarList, effectiveWeekFilter]
  );

  if (loading) {
    return (
      <MainLayout>
        <PageHeader title="文法一覧" />
        <LoadingState />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageHeader
        title="文法一覧"
        description={`${grammarList.length} ポイント`}
        actions={
          <Link href="/grammar/confusion">
            <Button variant="outline" size="sm">類似文法練習</Button>
          </Link>
        }
      />
      <WeekFilter value={effectiveWeekFilter} onChange={setWeekFilter} />
      <VirtualList
        items={filtered}
        estimateSize={80}
        renderItem={(g) => (
          <Link href={`/grammar/${g.id}`}>
            <Card variant="interactive" className="mb-2">
              <p className="font-medium text-brand">{g.pattern}</p>
              <CardDescription>{g.meaning}</CardDescription>
              <p className="mt-1 text-xs text-zinc-400">第{g.week}週</p>
            </Card>
          </Link>
        )}
      />
    </MainLayout>
  );
}

export default function GrammarListPage() {
  return (
    <Suspense
      fallback={
        <MainLayout>
          <PageHeader title="文法一覧" />
          <LoadingState />
        </MainLayout>
      }
    >
      <GrammarListContent />
    </Suspense>
  );
}
