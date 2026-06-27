"use client";

import { useEffect } from "react";
import { initializeWeakness } from "@/lib/db/local/schema";

export function DbProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initializeWeakness().catch(() => {});
  }, []);

  return <>{children}</>;
}
