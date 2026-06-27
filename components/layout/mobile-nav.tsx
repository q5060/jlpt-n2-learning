"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  BookOpen,
  Shuffle,
  GraduationCap,
  Settings,
  Menu,
  X,
  Languages,
  PenLine,
  FileText,
  Headphones,
  RotateCcw,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";

const mobileNav = [
  { href: "/dashboard", label: "ホーム", icon: Home },
  { href: "/study", label: "学習", icon: BookOpen },
  { href: "/review/mixed", label: "復習", icon: Shuffle },
  { href: "/exam", label: "試験", icon: GraduationCap },
  { href: "/settings", label: "設定", icon: Settings },
];

const drawerNav = [
  { href: "/dashboard", label: "ホーム", icon: Home },
  { href: "/vocab", label: "単語", icon: BookOpen },
  { href: "/kanji", label: "漢字", icon: Languages },
  { href: "/grammar", label: "文法", icon: PenLine },
  { href: "/grammar/confusion", label: "類似文法練習", icon: PenLine },
  { href: "/reading", label: "読解", icon: FileText },
  { href: "/listening", label: "聴解", icon: Headphones },
  { href: "/review", label: "復習キュー", icon: RotateCcw },
  { href: "/review/mixed", label: "混合復習", icon: Shuffle },
  { href: "/exam", label: "模擬試験", icon: GraduationCap },
  { href: "/import", label: "インポート", icon: Upload },
  { href: "/settings", label: "設定", icon: Settings },
];

function isActive(pathname: string, href: string) {
  if (href === "/study") {
    return ["/study", "/vocab", "/kanji", "/grammar", "/reading", "/listening"].some(
      (p) => pathname === p || pathname.startsWith(p + "/")
    );
  }
  return pathname === href || pathname.startsWith(href + "/");
}

export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="flex items-center justify-between border-b border-border bg-surface-elevated/90 p-4 backdrop-blur-md md:hidden dark:border-zinc-800">
        <h1 className="text-lg font-bold text-brand">N2 学習</h1>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-label="メニュー"
          className="rounded-xl p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </header>
      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30 md:hidden"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <nav className="fixed inset-y-0 right-0 z-50 w-72 overflow-y-auto border-l border-border bg-surface-elevated p-4 shadow-xl md:hidden dark:border-zinc-800">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-semibold text-zinc-900 dark:text-zinc-100">メニュー</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="閉じる"
                className="rounded-xl p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-1">
              {drawerNav.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm transition-colors",
                    isActive(pathname, href)
                      ? "bg-brand-muted font-medium text-brand-foreground dark:text-brand"
                      : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              ))}
            </div>
          </nav>
        </>
      )}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-border bg-surface-elevated/90 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur-md md:hidden dark:border-zinc-800">
        {mobileNav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2 text-xs transition-colors",
              isActive(pathname, href)
                ? "text-brand"
                : "text-zinc-500 dark:text-zinc-400"
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        ))}
      </nav>
    </>
  );
}
