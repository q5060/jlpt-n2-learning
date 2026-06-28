"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface AudioPlayerProps {
  src: string;
  examMode?: boolean;
  transcript?: string;
  onEnded?: () => void;
}

export function AudioPlayer({ src, examMode = false, transcript, onEnded }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [playCount, setPlayCount] = useState(0);
  const [audioMissing, setAudioMissing] = useState(false);
  const maxPlays = examMode ? 1 : 3;

  async function play() {
    if (playCount >= maxPlays) return;
    if (audioRef.current) {
      try {
        await audioRef.current.play();
        setPlaying(true);
        setPlayCount((c) => c + 1);
        setAudioMissing(false);
        return;
      } catch {
        setAudioMissing(true);
      }
    }
    if (!examMode && transcript && "speechSynthesis" in window) {
      const u = new SpeechSynthesisUtterance(transcript);
      u.lang = "ja-JP";
      u.onend = () => { setPlaying(false); onEnded?.(); };
      speechSynthesis.speak(u);
      setPlaying(true);
      setPlayCount((c) => c + 1);
    }
  }

  return (
    <Card className="space-y-3 !p-4">
      <audio ref={audioRef} src={src} onEnded={() => { setPlaying(false); onEnded?.(); }} onError={() => setAudioMissing(true)} preload="metadata" />
      <div className="flex items-center gap-3">
        <Button onClick={play} disabled={playing || playCount >= maxPlays} variant="primary">
          {playing ? "再生中..." : "再生"}
        </Button>
        <span className="text-sm text-zinc-500">残り {maxPlays - playCount} 回{examMode && "（試験モード）"}</span>
      </div>
      {audioMissing && examMode && (
        <p className="text-sm text-orange-600">音源をダウンロードしてください（設定ページ）</p>
      )}
      {!examMode && audioMissing && transcript && (
        <p className="text-xs text-zinc-400">練習用合成音声で再生します</p>
      )}
    </Card>
  );
}

export function ReadingTimer({ minutes, onTimeUp, running }: { minutes: number; onTimeUp: () => void; running: boolean }) {
  return (
    <ReadingTimerInner key={minutes} minutes={minutes} onTimeUp={onTimeUp} running={running} />
  );
}

function ReadingTimerInner({ minutes, onTimeUp, running }: { minutes: number; onTimeUp: () => void; running: boolean }) {
  const [seconds, setSeconds] = useState(minutes * 60);
  useEffect(() => {
    if (!running || seconds <= 0) return;
    const t = setInterval(() => {
      setSeconds((s) => { if (s <= 1) { onTimeUp(); return 0; } return s - 1; });
    }, 1000);
    return () => clearInterval(t);
  }, [running, seconds, onTimeUp]);
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return <div className={`text-lg font-mono ${seconds < 60 ? "text-brand" : "text-zinc-700 dark:text-zinc-300"}`}>残り {m}:{s.toString().padStart(2, "0")}</div>;
}
