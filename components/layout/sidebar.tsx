"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  RotateCcw,
  Headphones,
  Home,
  Languages,
  FileText,
  GraduationCap,
  Upload,
  Settings,
  PenLine,
  Shuffle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_LABELS } from "@/lib/ui/labels";

const navGroups = [
  {
    label: "学習",
    items: [
      { href: "/study", label: NAV_LABELS.studyHub, icon: BookOpen },
      { href: "/vocab", label: "単語", icon: BookOpen },
      { href: "/kanji", label: "漢字", icon: Languages },
      { href: "/grammar", label: "文法", icon: PenLine },
      { href: "/reading", label: "読解", icon: FileText },
      { href: "/listening", label: "聴解", icon: Headphones },
    ],
  },
  {
    label: "復習",
    items: [
      { href: "/review", label: NAV_LABELS.reviewQueue, icon: RotateCcw },
      { href: "/review/mixed", label: NAV_LABELS.mixedReview, icon: Shuffle },
    ],
  },
  {
    label: "その他",
    items: [
      { href: "/exam", label: "模擬試験", icon: GraduationCap },
      { href: "/import", label: "インポート", icon: Upload },
      { href: "/settings", label: "設定", icon: Settings },
    ],
  },
];

const homeItem = { href: "/dashboard", label: "ホーム", icon: Home };

function isActive(pathname: string, href: string) {
  if (href === "/study") {
    return ["/study", "/vocab", "/kanji", "/grammar", "/reading", "/listening"].some(
      (p) => pathname === p || pathname.startsWith(p + "/")
    );
  }
  return pathname === href || pathname.startsWith(href + "/");
}

export function Sidebar() {
  const pathname = usePathname();

  const linkClass = (href: string) =>
    cn(
      "flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors",
      isActive(pathname, href)
        ? "bg-brand-muted font-medium text-brand-foreground dark:text-brand"
        : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800/80"
    );

  return (
    <aside className="flex h-screen w-56 shrink-0 flex-col border-r border-border bg-surface-elevated p-4 dark:border-zinc-800">
      <div className="mb-6">
        <h1 className="text-lg font-bold text-brand">N2 学習</h1>
        <p className="text-xs text-zinc-500">JLPT N2 対策</p>
      </div>
      <nav className="flex-1 space-y-4 overflow-y-auto">
        <Link href={homeItem.href} className={linkClass(homeItem.href)}>
          <homeItem.icon className="h-4 w-4" />
          {homeItem.label}
        </Link>
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="mb-1 px-3 text-xs font-medium uppercase tracking-wide text-zinc-400">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href} className={linkClass(href)}>
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
