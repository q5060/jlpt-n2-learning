"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress";
import { AUDIO_PACKS, downloadAudioPack } from "@/lib/audio/packs";

export function AudioPackDownloader({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [result, setResult] = useState<{ ok: number; fail: number } | null>(null);
  const [downloading, setDownloading] = useState(false);

  async function download(packId: "core" | "full") {
    const pack = AUDIO_PACKS.find((p) => p.id === packId);
    if (!pack) return;
    setDownloading(true);
    setResult(null);
    setProgress({ done: 0, total: pack.count });
    const res = await downloadAudioPack(packId, (done, total) => {
      setProgress({ done, total });
    });
    setResult(res);
    setDownloading(false);
    if (res.ok > 0) onDone();
  }

  return (
    <div className="space-y-3">
      {AUDIO_PACKS.map((pack) => (
        <Button
          key={pack.id}
          variant="outline"
          className="w-full justify-between"
          disabled={downloading}
          onClick={() => download(pack.id)}
        >
          <span>{pack.label}</span>
          <span className="text-xs text-zinc-400">{pack.size}</span>
        </Button>
      ))}
      {progress && (
        <div>
          <ProgressBar value={progress.done} max={progress.total} />
          <p className="mt-1 text-xs text-zinc-500">
            {progress.done} / {progress.total}
          </p>
        </div>
      )}
      {result && (
        <p className="text-sm text-zinc-600">
          成功: {result.ok} · 失敗: {result.fail}
        </p>
      )}
    </div>
  );
}
