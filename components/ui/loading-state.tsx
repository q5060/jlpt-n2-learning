import { cn } from "@/lib/utils";

interface LoadingStateProps {
  message?: string;
  className?: string;
  skeleton?: boolean;
}

export function LoadingState({
  message = "読み込み中...",
  className,
  skeleton,
}: LoadingStateProps) {
  if (skeleton) {
    return (
      <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-5", className)}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-2xl bg-zinc-200/80 dark:bg-zinc-800"
          />
        ))}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 py-16", className)}>
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-brand dark:border-zinc-700"
        role="status"
        aria-label={message}
      />
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{message}</p>
    </div>
  );
}
