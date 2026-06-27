"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const PHASES = [
  { label: "第1–8週", start: 1, end: 8 },
  { label: "第9–16週", start: 9, end: 16 },
  { label: "第17–26週", start: 17, end: 26 },
] as const;

interface WeekFilterProps {
  value: number | null;
  onChange: (week: number | null) => void;
  totalWeeks?: number;
  className?: string;
}

export function WeekFilter({
  value,
  onChange,
  totalWeeks = 26,
  className,
}: WeekFilterProps) {
  const activePhase = value
    ? PHASES.find((p) => value >= p.start && value <= p.end)
  : null;

  return (
    <div className={cn("mb-4 space-y-3", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant={value === null ? "primary" : "outline"}
          onClick={() => onChange(null)}
        >
          すべて
        </Button>
        {PHASES.map((phase) => (
          <Button
            key={phase.label}
            size="sm"
            variant={
              activePhase?.label === phase.label && value !== null ? "primary" : "outline"
            }
            onClick={() => onChange(phase.start)}
          >
            {phase.label}
          </Button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <label htmlFor="week-select" className="text-sm text-zinc-500 dark:text-zinc-400">
          週を選択:
        </label>
        <select
          id="week-select"
          value={value ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            onChange(v === "" ? null : Number(v));
          }}
          className="rounded-xl border border-zinc-300/80 bg-surface-elevated px-3 py-1.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value="">—</option>
          {Array.from({ length: totalWeeks }, (_, i) => i + 1).map((w) => (
            <option key={w} value={w}>
              第{w}週
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
