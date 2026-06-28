import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { AlertCircle } from "lucide-react";

interface ErrorStateProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  className?: string;
}

export function ErrorState({
  title,
  description,
  icon: Icon = AlertCircle,
  action,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-error/40 bg-error-muted px-6 py-12 text-center",
        className
      )}
      role="alert"
    >
      <Icon className="mb-3 h-10 w-10 text-error" strokeWidth={1.5} />
      <p className="font-medium text-zinc-700 dark:text-zinc-300">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
