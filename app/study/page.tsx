"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MainLayout } from "@/components/layout/main-layout";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/loading-state";
import { BookOpen, Languages, PenLine, FileText, Headphones } from "lucide-react";
import { getDueCards } from "@/lib/srs/fsrs";
import { getDueReviewCount } from "@/lib/weakness/review-queue";
import { getWeaknessScores, SKILL_LABELS } from "@/lib/weakness/engine";
import { NAV_LABELS } from "@/lib/ui/labels";
import type { SkillTag } from "@/lib/types";

const studyModules = [
  { href: "/vocab", label: "単語", description: "SRS フラッシュカードで語彙を強化", icon: BookOpen, skill: "vocab" as SkillTag },
  { href: "/kanji", label: "漢字", description: "読み・意味の復習モード", icon: Languages, skill: "kanji" as SkillTag },
  { href: "/grammar", label: "文法", description: "200 ポイントの文法一覧", icon: PenLine, skill: "grammar" as SkillTag },
  { href: "/reading", label: "読解", description: "長文読解と単語タップ辞書", icon: FileText, skill: "reading" as SkillTag },
  { href: "/listening", label: "聴解", description: "音声付きリスニング練習", icon: Headphones, skill: "listening" as SkillTag },
];

export default function StudyHubPage() {
  const [loading, setLoading] = useState(true);
  const [srsDue, setSrsDue] = useState(0);
  const [vocabDue, setVocabDue] = useState(0);
  const [kanjiDue, setKanjiDue] = useState(0);
  const [reviewQueue, setReviewQueue] = useState(0);
  const [weakestSkill, setWeakestSkill] = useState<SkillTag | null>(null);

  useEffect(() => {
    Promise.all([getDueCards(), getDueReviewCount(), getWeaknessScores()]).then(
      ([due, queue, scores]) => {
        setSrsDue(due.length);
        setVocabDue(due.filter((c) => c.cardType === "vocab").length);
        setKanjiDue(due.filter((c) => c.cardType === "kanji").length);
        setReviewQueue(queue);
        const weakest = (Object.entries(scores) as [SkillTag, number][]).sort(
          (a, b) => b[1] - a[1]
        )[0];
        setWeakestSkill(weakest?.[0] ?? null);
        setLoading(false);
      }
    );
  }, []);

  if (loading) {
    return (
      <MainLayout>
        <PageHeader title={NAV_LABELS.studyHub} />
        <LoadingState />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageHeader title={NAV_LABELS.studyHub} description="モジュールを選んで学習を始めましょう" />

      <Card className="mb-6">
        <CardTitle className="mb-3">今日の状況</CardTitle>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <p className="text-sm text-zinc-500">SRS 復習待ち</p>
            <p className="text-2xl font-bold text-brand">{srsDue}枚</p>
          </div>
          <div>
            <p className="text-sm text-zinc-500">{NAV_LABELS.reviewQueue}</p>
            <p className="text-2xl font-bold">{reviewQueue}問</p>
          </div>
          <div>
            <p className="text-sm text-zinc-500">重点スキル</p>
            <p className="text-lg font-semibold">
              {weakestSkill ? SKILL_LABELS[weakestSkill] : "—"}
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {srsDue > 0 && (
            <Link href="/review/mixed">
              <Button size="sm">{NAV_LABELS.mixedReview}</Button>
            </Link>
          )}
          {reviewQueue > 0 && (
            <Link href="/review">
              <Button size="sm" variant="outline">
                {NAV_LABELS.reviewQueue}
              </Button>
            </Link>
          )}
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        {studyModules.map(({ href, label, description, icon: Icon, skill }) => {
          const dueBadge =
            skill === "vocab" ? vocabDue : skill === "kanji" ? kanjiDue : null;
          return (
            <Link key={href} href={href}>
              <Card variant="interactive" className="h-full">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-brand-muted p-2.5 dark:bg-brand-muted">
                    <Icon className="h-5 w-5 text-brand" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle>{label}</CardTitle>
                      {dueBadge != null && dueBadge > 0 && (
                        <span className="rounded-full bg-brand-muted px-2 py-0.5 text-xs font-medium text-brand-foreground">
                          due {dueBadge}
                        </span>
                      )}
                    </div>
                    <CardDescription className="mt-1">{description}</CardDescription>
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </MainLayout>
  );
}
