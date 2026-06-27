import { loadListening } from "@/lib/content/loader";

export const AUDIO_PACKS = [
  { id: "core" as const, label: "核心聴解パック（60問）", size: "30MB", count: 60 },
  { id: "full" as const, label: "完全聴解パック（120問）", size: "60MB", count: 120 },
];

export async function downloadAudioPack(
  packId: "core" | "full",
  onProgress?: (done: number, total: number) => void
): Promise<{ ok: number; fail: number }> {
  const pack = AUDIO_PACKS.find((p) => p.id === packId);
  if (!pack) return { ok: 0, fail: 0 };

  const items = await loadListening();
  const urlList = items.slice(0, pack.count).map((l) => l.audioUrl);
  const cache = await caches.open("n2-audio-cache");
  let ok = 0;
  let fail = 0;

  for (let i = 0; i < urlList.length; i++) {
    try {
      const response = await fetch(urlList[i]);
      if (response.ok) {
        await cache.put(urlList[i], response);
        ok++;
      } else {
        fail++;
      }
    } catch {
      fail++;
    }
    onProgress?.(i + 1, urlList.length);
  }
  return { ok, fail };
}
