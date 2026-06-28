"use client";

import { useEffect, useState } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import Link from "next/link";
import { getContentLabel } from "@/lib/content/review-resolver";
import { getTopWeaknessItems } from "@/lib/weakness/items";
import { SKILL_LABELS } from "@/lib/weakness/engine";
import type { SkillTag } from "@/lib/types";

export function WeaknessHeatmap() {
  const [items, setItems] = useState<
    { contentId: string; skill: SkillTag; wrongCount: number; label: string }[]
  >([]);

  useEffect(() => {
    async function load() {
      const raw = await getTopWeaknessItems(40);
      const labeled = await Promise.all(
        raw.map(async (item) => ({
          ...item,
          label: await getContentLabel(item.contentId, item.skill),
        }))
      );
      setItems(labeled);
    }
    load().catch(() => setItems([]));
  }, []);

  if (items.length === 0) {
    return (
      <EmptyState
        title="弱点データがありません"
        description="間違えた問題がここに表示されます"
        className="py-6"
      />
    );
  }

  const max = Math.max(...items.map((i) => i.wrongCount), 1);

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-5 gap-1 sm:grid-cols-8">
        {items.map((item) => {
          const intensity = item.wrongCount / max;
          return (
            <Link
              key={item.contentId}
              href={`/review?skill=${item.skill}&contentId=${item.contentId}`}
              title={`${item.label}: ${item.wrongCount}回`}
              className="flex h-8 items-center justify-center rounded text-[10px] text-white transition-opacity hover:opacity-80"
              style={{
                backgroundColor: `color-mix(in srgb, var(--color-brand) ${Math.round((0.2 + intensity * 0.8) * 100)}%, transparent)`,
              }}
            >
              {item.wrongCount}
            </Link>
          );
        })}
      </div>
      <ul className="max-h-32 space-y-1 overflow-y-auto text-xs text-zinc-500">
        {items.slice(0, 8).map((item) => (
          <li key={item.contentId}>
            <Link href={`/review?skill=${item.skill}&contentId=${item.contentId}`} className="hover:text-brand">
              [{SKILL_LABELS[item.skill]}] {item.label.slice(0, 20)} — {item.wrongCount}回
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
