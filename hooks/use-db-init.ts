"use client";

import { useEffect, useState } from "react";
import { initializeWeakness } from "@/lib/db/local/schema";

export function useDbInit() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initializeWeakness().then(() => setReady(true));
  }, []);

  return ready;
}
