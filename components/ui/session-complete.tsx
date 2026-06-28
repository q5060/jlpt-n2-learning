import { cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";

interface SessionCompleteProps {
  title: string;
  stats?: string;
  description?: string;
  primaryAction?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  className?: string;
}

export function SessionComplete({
  title,
  stats,
  description,
  primaryAction,
  secondaryAction,
  className,
}: SessionCompleteProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-success/30 bg-success-muted px-6 py-12 text-center",
        className
      )}
    >
      <CheckCircle2 className="mb-3 h-12 w-12 text-success" strokeWidth={1.5} />
      <p className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">{title}</p>
      {stats && <p className="mt-1 text-lg font-medium text-brand">{stats}</p>}
      {description && (
        <p className="mt-2 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
      )}
      {(primaryAction || secondaryAction) && (
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {primaryAction}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}
