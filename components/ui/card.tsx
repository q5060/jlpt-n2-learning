import { cn } from "@/lib/utils";

type CardVariant = "default" | "compact" | "interactive" | "success" | "warning";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: CardVariant;
}

const variantStyles: Record<CardVariant, string> = {
  default: "",
  compact: "",
  interactive:
    "cursor-pointer transition-shadow hover:shadow-md dark:hover:shadow-zinc-900/50",
  success:
    "border-green-200/80 bg-green-50/80 dark:border-green-800 dark:bg-green-950/50",
  warning:
    "border-orange-200/80 bg-orange-50/80 dark:border-orange-800 dark:bg-orange-950/50",
};

export function Card({ children, className, variant = "default", ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-surface-elevated shadow-sm dark:border-zinc-800",
        variant === "compact" ? "p-3" : "p-5",
        variant !== "default" && variant !== "compact" && variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2 className={cn("text-lg font-semibold text-zinc-900 dark:text-zinc-100", className)}>
      {children}
    </h2>
  );
}

export function CardDescription({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("text-sm text-zinc-500 dark:text-zinc-400", className)}>{children}</p>
  );
}
