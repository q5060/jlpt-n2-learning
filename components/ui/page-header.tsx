import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  toolbar?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  actions,
  toolbar,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("mb-6", className)}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{title}</h1>
          {description && (
            <p className="mt-1 text-zinc-500 dark:text-zinc-400">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
        )}
      </div>
      {toolbar && <div className="mt-4 flex flex-wrap items-center gap-2">{toolbar}</div>}
    </div>
  );
}
