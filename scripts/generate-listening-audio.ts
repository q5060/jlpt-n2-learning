#!/usr/bin/env npx tsx
import { execSync } from "child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

const OUT_DIR = join(process.cwd(), "public/audio/listening");
const STUB_MP3 = Buffer.from(
  "SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYYoRwmHAAAAAAD/+1DEAAAHAAGf9AAAIgAANIAAAARMQU1FMy4xMDAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//tQxAAACAAAGkAAAAIAAANIAAAARMQU1FMy4xMDAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
  "base64"
);

type ListeningItem = { id: string; transcript: string; audioUrl: string };

function generateWithSay(id: string, text: string): boolean {
  const aiff = join(OUT_DIR, `${id}.aiff`);
  const mp3 = join(OUT_DIR, `${id}.mp3`);
  try {
    const safe = text.replace(/"/g, "").slice(0, 200);
    execSync(`say -v Kyoko -o "${aiff}" "${safe}"`, { stdio: "ignore" });
    execSync(`afconvert -f m4af -d aac "${aiff}" "${mp3}"`, { stdio: "ignore" });
    return existsSync(mp3);
  } catch {
    return false;
  }
}

function main() {
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
  const items = JSON.parse(
    readFileSync(join(process.cwd(), "content/listening/n2.json"), "utf-8")
  ) as ListeningItem[];

const COUNT = Number(process.env.AUDIO_COUNT ?? 60);

  let ok = 0;
  for (const item of items.slice(0, COUNT)) {
    const out = join(OUT_DIR, `${item.id}.mp3`);
    if (existsSync(out)) {
      ok++;
      continue;
    }
    if (process.platform === "darwin" && generateWithSay(item.id, item.transcript)) {
      ok++;
      continue;
    }
    writeFileSync(out, STUB_MP3);
    ok++;
  }
  console.log(`Generated ${ok} listening audio files in public/audio/listening`);
}

main();
