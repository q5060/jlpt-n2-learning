"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { GrammarExerciseCard } from "@/components/grammar/exercise-card";
import { AudioPlayer } from "@/components/listening/audio-player";
import { TokenizedPassage } from "@/components/reading/tokenized-passage";
import type { ResolvedReviewItem } from "@/lib/content/review-resolver";

interface ReviewQuestionCardProps {
  item: ResolvedReviewItem;
  onAnswer: (passed: boolean) => void;
  skipEnqueue?: boolean;
}

export function ReviewQuestionCard({
  item,
  onAnswer,
  skipEnqueue = true,
}: ReviewQuestionCardProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [correct, setCorrect] = useState(false);

  if (item.kind === "grammar") {
    return (
      <GrammarExerciseCard
        exercise={item.exercise}
        grammarId={item.grammarId}
        onComplete={(passed) => onAnswer(passed)}
        skipEnqueue={skipEnqueue}
      />
    );
  }

  function submitOption(correctIndex: number, index: number) {
    const isCorrect = index === correctIndex;
    setSelected(index);
    setSubmitted(true);
    setCorrect(isCorrect);
    onAnswer(isCorrect);
  }

  if (item.kind === "exam") {
    const q = item.question;
    return (
      <Card>
        <CardTitle className="mb-4 text-base">{q.prompt}</CardTitle>
        <div className="grid gap-2">
          {q.options.map((opt, i) => (
            <Button
              key={i}
              variant={selected === i ? "primary" : "outline"}
              className="justify-start"
              disabled={submitted}
              onClick={() => submitOption(q.correctIndex, i)}
            >
              {opt}
            </Button>
          ))}
        </div>
        {submitted && (
          <p
            className={`mt-4 rounded p-3 text-sm ${correct ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}
          >
            {correct ? "正解！" : "不正解"} — {q.explanation}
          </p>
        )}
      </Card>
    );
  }

  if (item.kind === "reading") {
    const { passage, question } = item;
    return (
      <Card>
        <h2 className="mb-2 font-semibold">{passage.title}</h2>
        <TokenizedPassage content={passage.content} />
        <CardTitle className="mb-4 text-base">{question.question}</CardTitle>
        <div className="grid gap-2">
          {question.options.map((opt, i) => (
            <Button
              key={i}
              variant={selected === i ? "primary" : "outline"}
              className="justify-start"
              disabled={submitted}
              onClick={() => submitOption(question.correctIndex, i)}
            >
              {opt}
            </Button>
          ))}
        </div>
        {submitted && (
          <p
            className={`mt-4 rounded p-3 text-sm ${correct ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}
          >
            {correct ? "正解！" : "不正解"} — {question.explanation}
          </p>
        )}
      </Card>
    );
  }

  const { item: listening, questionIndex } = item;
  const question = listening.questions[questionIndex];
  return (
    <Card>
      <h2 className="mb-2 font-semibold">{listening.title}</h2>
      <AudioPlayer src={listening.audioUrl} transcript={listening.transcript} />
      <CardTitle className="mb-4 mt-4 text-base">{question.question}</CardTitle>
      <div className="grid gap-2">
        {question.options.map((opt, i) => (
          <Button
            key={i}
            variant={selected === i ? "primary" : "outline"}
            className="justify-start"
            disabled={submitted}
            onClick={() => submitOption(question.correctIndex, i)}
          >
            {opt}
          </Button>
        ))}
      </div>
      {submitted && (
        <p
          className={`mt-4 rounded p-3 text-sm ${correct ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}
        >
          {correct ? "正解！" : "不正解"} — {question.explanation}
        </p>
      )}
    </Card>
  );
}
