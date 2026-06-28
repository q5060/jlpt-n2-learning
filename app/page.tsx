"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSettings } from "@/lib/db/local/schema";
import { LoadingState } from "@/components/ui/loading-state";

export default function HomePage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    getSettings().then((s) => {
      router.replace(s.placementCompleted ? "/dashboard" : "/placement");
      setChecking(false);
    });
  }, [router]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <LoadingState />
      </div>
    );
  }

  return null;
}
