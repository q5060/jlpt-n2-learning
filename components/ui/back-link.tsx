import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface BackLinkProps {
  href?: string;
  onClick?: () => void;
  label?: string;
  className?: string;
}

const backLinkClass =
  "mb-4 inline-flex items-center gap-1.5 rounded-xl px-2 py-1.5 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand-muted dark:text-brand dark:hover:bg-brand-muted";

export function BackLink({ href, onClick, label = "戻る", className }: BackLinkProps) {
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cn(backLinkClass, className)}>
        <ArrowLeft className="h-4 w-4" />
        {label}
      </button>
    );
  }
  return (
    <Link href={href ?? "/"} className={cn(backLinkClass, className)}>
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Link>
  );
}
