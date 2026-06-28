"use client";

import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center p-6">
      <ErrorState
        title="エラーが発生しました"
        description={error.message || "ページを読み込めませんでした。"}
        action={
          <Button onClick={reset} variant="outline">
            再試行
          </Button>
        }
      />
    </div>
  );
}
