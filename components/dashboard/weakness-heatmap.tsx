"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/db/local/schema";
import { getContentLabel } from "@/lib/content/review-resolver";
import type { SkillTag } from "@/lib/types";

export function WeaknessHeatmap() {
  const [items, setItems] = useState<
    { contentId: string; skill: SkillTag; wrongCount: number; label: string }[]
  >([]);

  useEffect(() => {
    async function load() {
      const raw = await db.weaknessItems.orderBy("wrongCount").reverse().limit(40).toArray();
      const labeled = await Promise.all(
        raw.map(async (item) => ({
          ...item,
          label: await getContentLabel(item.contentId, item.skill),
        }))
      );
      setItems(labeled);
    }
    load();
  }, []);

  if (items.length === 0) {
    return <p className="text-sm text-zinc-500">間違えた問題がここに表示されます</p>;
  }

  const max = Math.max(...items.map((i) => i.wrongCount), 1);

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-5 gap-1 sm:grid-cols-8">
        {items.map((item) => {
          const intensity = item.wrongCount / max;
          return (
            <div
              key={item.contentId}
              title={`${item.label}: ${item.wrongCount}回`}
              className="flex h-8 items-center justify-center rounded text-[10px] text-white"
              style={{
                backgroundColor: `color-mix(in srgb, var(--color-brand) ${Math.round((0.2 + intensity * 0.8) * 100)}%, transparent)`,
              }}
            >
              {item.wrongCount}
            </div>
          );
        })}
      </div>
      <ul className="max-h-32 space-y-1 overflow-y-auto text-xs text-zinc-500">
        {items.slice(0, 8).map((item) => (
          <li key={item.contentId}>
            {item.label.slice(0, 24)} — {item.wrongCount}回
          </li>
        ))}
      </ul>
    </div>
  );
}
