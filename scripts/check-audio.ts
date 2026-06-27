#!/usr/bin/env npx tsx
import { existsSync, readFileSync } from "fs";
import { join } from "path";

const COUNT = Number(process.env.AUDIO_COUNT ?? process.argv[2] ?? 60);

const listening = JSON.parse(
  readFileSync(join(process.cwd(), "content/listening/n2.json"), "utf-8")
) as { id: string; audioUrl: string }[];

let missing = 0;
for (const item of listening.slice(0, COUNT)) {
  const path = join(process.cwd(), "public", item.audioUrl);
  if (!existsSync(path)) {
    console.error("Missing:", item.audioUrl);
    missing++;
  }
}

if (missing > 0) {
  console.error(`${missing} audio files missing (expected ${COUNT})`);
  process.exit(1);
}
console.log(`All ${COUNT} listening audio files exist`);
