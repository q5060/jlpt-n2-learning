"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getSettings } from "@/lib/db/local/schema";
import { LoadingState } from "@/components/ui/loading-state";

const ALLOWED_WITHOUT_PLACEMENT = ["/placement", "/login", "/settings"];

function isAllowedPath(pathname: string): boolean {
  return ALLOWED_WITHOUT_PLACEMENT.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

export function PlacementGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [placementDone, setPlacementDone] = useState(true);

  useEffect(() => {
    getSettings().then((s) => {
      setPlacementDone(s.placementCompleted);
      setReady(true);
    });
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!placementDone && !isAllowedPath(pathname)) {
      router.replace("/placement");
    }
  }, [ready, placementDone, pathname, router]);

  if (!ready) {
    return <LoadingState className="py-24" />;
  }

  if (!placementDone && !isAllowedPath(pathname)) {
    return <LoadingState message="診断テストへ移動中..." className="py-24" />;
  }

  return <>{children}</>;
}
