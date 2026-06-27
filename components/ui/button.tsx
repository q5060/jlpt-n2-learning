import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

export function Button({
  children,
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-xl font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 disabled:opacity-50 dark:focus-visible:ring-offset-zinc-900",
        {
          "bg-brand text-white hover:bg-brand-hover": variant === "primary",
          "bg-zinc-100 text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700":
            variant === "secondary",
          "border border-zinc-300/80 bg-transparent hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800":
            variant === "outline",
          "bg-transparent hover:bg-brand-muted text-zinc-700 dark:text-zinc-300 dark:hover:bg-brand-muted":
            variant === "ghost",
          "border border-red-300 bg-transparent text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950":
            variant === "danger",
          "px-3 py-1.5 text-sm": size === "sm",
          "px-4 py-2 text-sm": size === "md",
          "px-6 py-3 text-base": size === "lg",
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
