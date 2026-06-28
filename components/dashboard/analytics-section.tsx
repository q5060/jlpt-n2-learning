"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function AnalyticsSection({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    setOpen(window.matchMedia("(min-width: 1024px)").matches);
  }, []);

  return (
    <div className={cn("rounded-2xl border border-border bg-surface-elevated p-5 shadow-sm dark:border-zinc-800", className)}>
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 text-left lg:pointer-events-none"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>
        <ChevronDown
          className={cn(
            "h-5 w-5 text-zinc-400 transition-transform lg:hidden",
            open && "rotate-180"
          )}
        />
      </button>
      <div className={cn("mt-4", !open && "hidden lg:block")}>{children}</div>
    </div>
  );
}
