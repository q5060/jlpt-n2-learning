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
  const [done, setDone] = useState(false);
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
    const rating = ratingFromButton(button);
    const skill = type === "vocab" ? "vocab" : "kanji";
    await reviewCard(cardId, rating, skill);
    const correct = rating >= Rating.Good;
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
    setDone(true);
    onComplete();
  }

  function checkRecall() {
    const answer = vocab?.word ?? kanji?.character ?? "";
    const correct = recallInput.trim() === answer;
    handleRating(correct ? 3 : 1);
  }

  function playAudio() {
    if (vocab && "speechSynthesis" in window) {
      const u = new SpeechSynthesisUtterance(vocab.word);
      u.lang = "ja-JP";
      speechSynthesis.speak(u);
    }
  }

  if (done) return null;

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
          />
          <Button onClick={checkRecall}>確認</Button>
        </div>
      ) : (
        <div
          className="flex min-h-48 cursor-pointer flex-col items-center justify-center p-8"
          onClick={() => setFlipped(!flipped)}
        >
          {!flipped ? (
            <p className="text-4xl font-bold">{front}</p>
          ) : (
            back
          )}
          <p className="mt-4 text-xs text-zinc-400">
            {flipped ? "タップで表に戻る" : "タップで答えを見る"}
          </p>
        </div>
      )}
      {flipped && mode !== "recall" && (
        <div className="grid grid-cols-4 gap-2 border-t border-border pt-4 pb-safe">
          <Button variant="danger" size="sm" onClick={() => handleRating(1)}>
            忘れた
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleRating(2)}>
            難しい
          </Button>
          <Button variant="secondary" size="sm" onClick={() => handleRating(3)}>
            普通
          </Button>
          <Button variant="primary" size="sm" onClick={() => handleRating(4)}>
            簡単
          </Button>
        </div>
      )}
    </Card>
  );
}
