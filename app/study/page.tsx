import Link from "next/link";
import { MainLayout } from "@/components/layout/main-layout";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { BookOpen, Languages, PenLine, FileText, Headphones } from "lucide-react";

const studyModules = [
  {
    href: "/vocab",
    label: "単語",
    description: "SRS フラッシュカードで語彙を強化",
    icon: BookOpen,
  },
  {
    href: "/kanji",
    label: "漢字",
    description: "読み・意味の復習モード",
    icon: Languages,
  },
  {
    href: "/grammar",
    label: "文法",
    description: "200 ポイントの文法一覧",
    icon: PenLine,
  },
  {
    href: "/reading",
    label: "読解",
    description: "長文読解と単語タップ辞書",
    icon: FileText,
  },
  {
    href: "/listening",
    label: "聴解",
    description: "音声付きリスニング練習",
    icon: Headphones,
  },
];

export default function StudyHubPage() {
  return (
    <MainLayout>
      <PageHeader title="学習" description="モジュールを選んで学習を始めましょう" />
      <div className="grid gap-4 sm:grid-cols-2">
        {studyModules.map(({ href, label, description, icon: Icon }) => (
          <Link key={href} href={href}>
            <Card variant="interactive" className="h-full">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-brand-muted p-2.5 dark:bg-brand-muted">
                  <Icon className="h-5 w-5 text-brand" />
                </div>
                <div>
                  <CardTitle>{label}</CardTitle>
                  <CardDescription className="mt-1">{description}</CardDescription>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </MainLayout>
  );
}
