import { getGrammarById, loadConfusionPairs } from "@/lib/content/loader";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardTitle } from "@/components/ui/card";
import { BackLink } from "@/components/ui/back-link";
import { PageHeader } from "@/components/ui/page-header";
import { GrammarExerciseCard } from "@/components/grammar/exercise-card";

export default async function GrammarDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const grammar = await getGrammarById(id);
  if (!grammar) {
    return (
      <MainLayout>
        <BackLink href="/grammar" label="文法一覧" />
        <p className="text-zinc-500">文法が見つかりません</p>
      </MainLayout>
    );
  }

  const confusionPairs = await loadConfusionPairs();
  const confusions = confusionPairs.filter(
    (p) => p.a === grammar.pattern || p.b === grammar.pattern
  );

  return (
    <MainLayout>
      <BackLink href="/grammar" label="文法一覧" />
      <PageHeader title={grammar.pattern} description={`第${grammar.week}週`} />
      <div className="mb-8 grid gap-4 lg:grid-cols-2">
        <Card><CardTitle className="mb-3">接続</CardTitle><p>{grammar.connection}</p></Card>
        <Card><CardTitle className="mb-3">意味</CardTitle><p>{grammar.meaning}</p></Card>
        <Card className="lg:col-span-2"><CardTitle className="mb-3">ニュアンス</CardTitle><p>{grammar.nuance}</p></Card>
      </div>
      <Card className="mb-8">
        <CardTitle className="mb-4">例文</CardTitle>
        {grammar.examples.map((ex, i) => (
          <div key={i} className="mb-3 border-l-2 border-brand/30 pl-4">
            <p>{ex.japanese}</p>
            {ex.note && <p className="text-sm text-zinc-500">{ex.note}</p>}
          </div>
        ))}
      </Card>
      {confusions.length > 0 && (
        <Card className="mb-8">
          <CardTitle className="mb-4">類似文法との比較</CardTitle>
          {confusions.map((c, i) => (
            <div key={i} className="mb-3 text-sm">
              <p className="font-medium">{c.a} vs {c.b}</p>
              <p className="text-zinc-500">{c.difference}</p>
            </div>
          ))}
        </Card>
      )}
      <h2 className="mb-4 text-xl font-bold">練習問題</h2>
      <div className="space-y-4">
        {grammar.exercises.map((ex) => (
          <GrammarExerciseCard key={ex.id} exercise={ex} grammarId={grammar.id} />
        ))}
      </div>
    </MainLayout>
  );
}
