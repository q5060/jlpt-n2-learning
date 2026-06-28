import { cn } from "@/lib/utils";

export function ProgressBar({
  value,
  max = 100,
  className,
  label = "進捗",
}: {
  value: number;
  max?: number;
  className?: string;
  label?: string;
}) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn(
        "h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800",
        className
      )}
    >
      <div
        className="h-full rounded-full bg-brand transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
