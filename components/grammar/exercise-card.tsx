"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import type { GrammarExercise } from "@/lib/types";
import { enqueueWrongAnswer } from "@/lib/weakness/review-queue";
import { recordAttempt } from "@/lib/weakness/engine";

export function GrammarExerciseCard({
  exercise,
  grammarId,
  onComplete,
  skipEnqueue = false,
}: {
  exercise: GrammarExercise;
  grammarId: string;
  onComplete?: (passed: boolean) => void;
  skipEnqueue?: boolean;
}) {
  const [answer, setAnswer] = useState("");
  const [selected, setSelected] = useState<number | null>(null);
  const [reorder, setReorder] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [correct, setCorrect] = useState(false);

  async function submit(selectedAnswer?: string) {
    let isCorrect = false;
    const ans = selectedAnswer ?? answer;

    if (exercise.type === "reorder") {
      isCorrect =
        JSON.stringify(reorder) === JSON.stringify(exercise.correctAnswer);
    } else if (exercise.type === "fill_blank" || exercise.type === "meaning") {
      isCorrect = ans === exercise.correctAnswer;
    } else {
      isCorrect = ans.trim() === String(exercise.correctAnswer).trim();
    }

    setCorrect(isCorrect);
    setSubmitted(true);
    if (!isCorrect && !skipEnqueue) {
      await enqueueWrongAnswer(
        grammarId,
        "grammar",
        "grammar",
        "drill",
        exercise.question,
        exercise.id
      );
    }
    await recordAttempt("grammar", isCorrect, grammarId);
    onComplete?.(isCorrect);
  }

  function addToReorder(word: string) {
    if (reorder.includes(word)) return;
    setReorder([...reorder, word]);
  }

  const typeLabels = {
    fill_blank: "穴埋め",
    reorder: "並べ替え",
    correction: "誤文訂正",
    meaning: "意味選択",
  };

  return (
    <Card>
      <div className="mb-2 text-xs text-brand-foreground">{typeLabels[exercise.type]}</div>
      <CardTitle className="mb-4 text-base">{exercise.question}</CardTitle>

      {(exercise.type === "fill_blank" || exercise.type === "meaning") &&
        exercise.options && (
          <div className="grid gap-2">
            {exercise.options.map((opt, i) => (
              <Button
                key={i}
                variant={selected === i ? "primary" : "outline"}
                className="justify-start"
                onClick={() => {
                  setSelected(i);
                  if (!submitted) submit(opt);
                }}
                disabled={submitted}
              >
                {opt}
              </Button>
            ))}
          </div>
        )}

      {exercise.type === "reorder" && exercise.options && (
        <div className="space-y-3">
          <div className="flex min-h-10 flex-wrap gap-2 rounded-xl border border-border p-2">
            {reorder.map((w, i) => (
              <span
                key={i}
                className="rounded-lg bg-brand-muted px-2 py-1 text-sm dark:bg-brand-muted"
              >
                {w}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {exercise.options
              .filter((o) => !reorder.includes(o))
              .map((opt) => (
                <Button
                  key={opt}
                  variant="outline"
                  size="sm"
                  onClick={() => addToReorder(opt)}
                >
                  {opt}
                </Button>
              ))}
          </div>
          <Button onClick={() => submit()} disabled={submitted}>
            確認
          </Button>
        </div>
      )}

      {exercise.type === "correction" && (
        <div className="space-y-2">
          <textarea
            className="w-full rounded-xl border border-zinc-300/80 bg-surface-elevated px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-zinc-700 dark:bg-zinc-900"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            disabled={submitted}
          />
          <Button onClick={() => submit()} disabled={submitted}>
            確認
          </Button>
        </div>
      )}

      {submitted && (
        <div
          className={`mt-4 rounded p-3 text-sm ${correct ? "bg-green-50 text-green-800 dark:bg-green-950" : "bg-red-50 text-red-800 dark:bg-red-950"}`}
        >
          <p className="font-medium">{correct ? "正解！" : "不正解"}</p>
          <p className="mt-1">{exercise.explanation}</p>
        </div>
      )}
    </Card>
  );
}
