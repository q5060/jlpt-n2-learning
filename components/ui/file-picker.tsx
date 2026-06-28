"use client";

import { useId, useRef } from "react";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilePickerProps {
  accept: string;
  label: string;
  hint?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}

export function FilePicker({ accept, label, hint, onChange, className }: FilePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const id = useId();

  return (
    <div className={cn("relative", className)}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={onChange}
        className="sr-only"
        id={id}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex w-full flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300/80 bg-surface px-6 py-8 text-center transition-colors hover:border-brand hover:bg-brand-muted/30 dark:border-zinc-700"
      >
        <Upload className="mb-2 h-8 w-8 text-zinc-400" strokeWidth={1.5} />
        <span className="font-medium text-zinc-700 dark:text-zinc-300">{label}</span>
        {hint && <span className="mt-1 text-sm text-zinc-500">{hint}</span>}
      </button>
    </div>
  );
}
