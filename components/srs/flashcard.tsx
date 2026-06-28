"use client";

import { useState } from "react";
import { Rating } from "ts-fsrs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { reviewCard, ratingFromButton } from "@/lib/srs/fsrs";
import { recordAttempt } from "@/lib/weakness/engine";
import { REVIEW_MODE_LABELS } from "@/lib/ui/labels";
import { db } from "@/lib/db/local/schema";
import type { VocabEntry, KanjiEntry, ReviewMode } from "@/lib/types";

interface FlashcardProps {
  item: VocabEntry | KanjiEntry;
  type: "vocab" | "kanji";
  cardId: string;
  mode?: ReviewMode;
  onComplete: () => void;
}

export function Flashcard({
  item,
  type,
  cardId,
  mode = "recognition",
  onComplete,
}: FlashcardProps) {
  const [flipped, setFlipped] = useState(false);
  const [rating, setRating] = useState(false);
  const [recallInput, setRecallInput] = useState("");

  const vocab = type === "vocab" ? (item as VocabEntry) : null;
  const kanji = type === "kanji" ? (item as KanjiEntry) : null;

  const front =
    mode === "recall"
      ? vocab?.meaning ?? kanji?.meaning ?? ""
      : mode === "cloze" && vocab
        ? vocab.example.replace(vocab.word, "＿＿")
        : vocab?.word ?? kanji?.character ?? "";

  async function handleRating(button: 1 | 2 | 3 | 4) {
    if (rating) return;
    setRating(true);
    const fsrsRating = ratingFromButton(button);
    const skill = type === "vocab" ? "vocab" : "kanji";
    await reviewCard(cardId, fsrsRating, skill);
    const correct = fsrsRating >= Rating.Good;
    await recordAttempt(skill, correct, item.id);

    const today = new Date().toISOString().split("T")[0];
    const session = await db.studySessions.get(today);
    if (session) {
      await db.studySessions.put({
        ...session,
        cardsReviewed: session.cardsReviewed + 1,
        minutes: session.minutes + 1,
      });
    } else {
      await db.studySessions.put({
        id: today,
        date: today,
        minutes: 1,
        cardsReviewed: 1,
      });
    }
    onComplete();
  }

  function checkRecall() {
    const answer = vocab?.word ?? kanji?.character ?? "";
    const correct = recallInput.trim() === answer;
    handleRating(correct ? 3 : 1);
  }

  function playAudio() {
    if (!vocab) return;
    const src = vocab.audioUrl ?? `/audio/vocab/${vocab.id}.mp3`;
    const audio = new Audio(src);
    audio.play().catch(() => {
      if ("speechSynthesis" in window) {
        const u = new SpeechSynthesisUtterance(vocab.word);
        u.lang = "ja-JP";
        speechSynthesis.speak(u);
      }
    });
  }

  function toggleFlip() {
    if (mode === "recall" && flipped) return;
    setFlipped((f) => !f);
  }

  function handleFlipKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleFlip();
    }
  }

  const back =
    type === "vocab" ? (
      <div className="space-y-2 text-center">
        <p className="text-2xl">{vocab!.reading}</p>
        <p className="text-lg">{vocab!.meaning}</p>
        <p className="text-sm text-zinc-500">{vocab!.example}</p>
      </div>
    ) : (
      <div className="space-y-2 text-center">
        <p>{kanji!.onyomi.join("・")}</p>
        <p>{kanji!.kunyomi.join("・")}</p>
        <p className="text-lg">{kanji!.meaning}</p>
      </div>
    );

  return (
    <Card className="mx-auto max-w-lg pb-safe">
      <p className="mb-2 text-center text-xs text-zinc-400">
        モード: {REVIEW_MODE_LABELS[mode]}
      </p>
      {mode === "listening" && (
        <div className="mb-4 text-center">
          <Button onClick={playAudio}>音声を再生（練習用）</Button>
        </div>
      )}
      {mode === "recall" && flipped ? (
        <div className="space-y-3 p-6">
          <Input
            value={recallInput}
            onChange={(e) => setRecallInput(e.target.value)}
            placeholder="答えを入力"
            onKeyDown={(e) => e.key === "Enter" && checkRecall()}
          />
          <Button onClick={checkRecall} disabled={rating}>
            確認
          </Button>
        </div>
      ) : (
        <button
          type="button"
          className="flashcard-face flex min-h-48 w-full cursor-pointer flex-col items-center justify-center rounded-xl p-8 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          onClick={toggleFlip}
          onKeyDown={handleFlipKey}
          aria-pressed={flipped}
          aria-label={flipped ? "答えを表示中。タップで表に戻る" : "タップで答えを見る"}
        >
          {!flipped ? (
            <p className="text-4xl font-bold">{front}</p>
          ) : (
            back
          )}
          <p className="mt-4 text-xs text-zinc-400">
            {flipped ? "タップで表に戻る" : "タップで答えを見る"}
          </p>
        </button>
      )}
      {flipped && mode !== "recall" && (
        <div className="grid grid-cols-2 gap-2 border-t border-border pt-4 pb-safe sm:grid-cols-4">
          <Button variant="danger" size="sm" disabled={rating} onClick={() => handleRating(1)}>
            忘れた
          </Button>
          <Button variant="outline" size="sm" disabled={rating} onClick={() => handleRating(2)}>
            難しい
          </Button>
          <Button variant="secondary" size="sm" disabled={rating} onClick={() => handleRating(3)}>
            普通
          </Button>
          <Button variant="primary" size="sm" disabled={rating} onClick={() => handleRating(4)}>
            簡単
          </Button>
        </div>
      )}
    </Card>
  );
}
