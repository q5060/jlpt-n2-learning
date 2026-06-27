"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingState } from "@/components/ui/loading-state";
import { WeekFilter } from "@/components/ui/week-filter";
import { VirtualList } from "@/components/ui/virtual-list";
import { getGrammarListMeta, type GrammarMeta } from "@/lib/content/loader";

export default function GrammarListPage() {
  const [grammarList, setGrammarList] = useState<GrammarMeta[]>([]);
  const [weekFilter, setWeekFilter] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const w = params.get("week");
    if (w) setWeekFilter(Number(w));
  }, []);

  useEffect(() => {
    getGrammarListMeta().then((g) => {
      setGrammarList(g);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(
    () => (weekFilter ? grammarList.filter((g) => g.week === weekFilter) : grammarList),
    [grammarList, weekFilter]
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
      <WeekFilter value={weekFilter} onChange={setWeekFilter} />
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
