"use client";

import { useState, useEffect, useCallback } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingState } from "@/components/ui/loading-state";
import { ProgressBar } from "@/components/ui/progress";
import { WeaknessRadar } from "@/components/dashboard/weakness-radar";
import { loadExam, getReadingById } from "@/lib/content/loader";
import { enqueueWrongAnswer } from "@/lib/weakness/review-queue";
import { recordAttempt } from "@/lib/weakness/engine";
import { logStudyMinutes } from "@/lib/study/session-log";
import { scoreExam, formatTime, PASS_LINE } from "@/lib/exam/scoring";
import { estimatePassProbability } from "@/lib/weakness/engine";
import { db } from "@/lib/db/local/schema";
import { AudioPlayer } from "@/components/listening/audio-player";
import { TokenizedPassage } from "@/components/reading/tokenized-passage";
import type { SkillTag } from "@/lib/types";

type ExamPhase = "intro" | "language" | "listening" | "result";

export default function ExamPage() {
  const [phase, setPhase] = useState<ExamPhase>("intro");
  const [examQuestions, setExamQuestions] = useState<Awaited<ReturnType<typeof loadExam>>>([]);
  const [passageCache, setPassageCache] = useState<{ id: string; text: string } | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [qIndex, setQIndex] = useState(0);
  const [seconds, setSeconds] = useState(105 * 60);
  const [result, setResult] = useState<ReturnType<typeof scoreExam> | null>(
    null
  );
  const [passProb, setPassProb] = useState(0);

  const languageQs = examQuestions.filter(
    (q) => q.section === "language" || q.section === "reading"
  );
  const listeningQs = examQuestions.filter((q) => q.section === "listening");
  const currentQs = phase === "listening" ? listeningQs : languageQs;
  const q = currentQs[qIndex];
  const passageText =
    q?.passageId && passageCache?.id === q.passageId ? passageCache.text : null;

  const [examLoaded, setExamLoaded] = useState(false);

  useEffect(() => {
    loadExam().then((q) => {
      setExamQuestions(q);
      setExamLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!q?.passageId) return;
    const passageId = q.passageId;
    getReadingById(passageId).then((p) =>
      setPassageCache({ id: passageId, text: p?.content ?? "" })
    );
  }, [q?.passageId, q?.id]);

  const finishExam = useCallback(async () => {
    if (examQuestions.length === 0) return;
    const scored = scoreExam(examQuestions, answers);
    const history = await db.examResults.toArray();
    const prob = estimatePassProbability(
      scored.languageScore,
      scored.readingScore,
      scored.listeningScore,
      history
    );
    setPassProb(prob);
    setResult(scored);

    await db.examResults.put({
      id: `exam-${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      languageScore: scored.languageScore,
      readingScore: scored.readingScore,
      listeningScore: scored.listeningScore,
      totalScore: scored.totalScore,
      passed: scored.passed,
      passProbability: prob,
      answers: JSON.stringify(answers),
    });

    for (const eq of examQuestions) {
      const isCorrect = answers[eq.id] === eq.correctIndex;
      await recordAttempt(eq.skill, isCorrect, eq.id);
      if (!isCorrect) {
        await enqueueWrongAnswer(
          eq.id,
          eq.skill,
          eq.skill === "reading" ? "reading" : eq.skill === "listening" ? "listening" : eq.skill === "grammar" ? "grammar" : "vocab",
          "exam",
          eq.prompt
        );
      }
    }

    await logStudyMinutes(155);

    setPhase("result");
  }, [answers, examQuestions]);

  useEffect(() => {
    if (phase !== "language" && phase !== "listening") return;
    const t = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          if (phase === "language") {
            setPhase("listening");
            setQIndex(0);
            return 50 * 60;
          }
          finishExam();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [phase, finishExam]);

  function startExam() {
    setPhase("language");
    setQIndex(0);
    setSeconds(105 * 60);
    setAnswers({});
  }

  if (!examLoaded) {
    return (
      <MainLayout>
        <PageHeader title="JLPT N2 模擬試験" />
        <LoadingState />
      </MainLayout>
    );
  }

  if (phase === "intro") {
    return (
      <MainLayout>
        <PageHeader title="JLPT N2 模擬試験" description="本番形式の模擬試験" />
        <Card className="mb-6">
          <CardTitle className="mb-4">試験構成</CardTitle>
          <ul className="space-y-2 text-sm">
            <li>言語知識・読解：105分（{languageQs.length}問）</li>
            <li>聴解：50分（{listeningQs.length}問）</li>
            <li>合格ライン：総合90点以上、各セクション19点以上</li>
          </ul>
        </Card>
        <Button size="lg" onClick={startExam}>
          試験開始
        </Button>
      </MainLayout>
    );
  }

  if (phase === "result" && result) {
    const weaknessScores = Object.fromEntries(
      Object.entries(result.breakdown).map(([skill, { correct, total }]) => [
        skill,
        1 - correct / Math.max(total, 1),
      ])
    ) as Record<SkillTag, number>;

    return (
      <MainLayout>
        <PageHeader title="試験結果" />
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <p className="text-sm text-zinc-500">総合</p>
            <p className="text-3xl font-bold">
              {result.totalScore}/{PASS_LINE.maxTotal}
            </p>
            <p
              className={
                result.passed ? "text-green-600 dark:text-green-400" : "text-brand"
              }
            >
              {result.passed ? "合格圏内" : "不合格圏内"}
            </p>
          </Card>
          <Card>
            <p className="text-sm text-zinc-500">言語知識</p>
            <p className="text-2xl font-bold">{result.languageScore}</p>
          </Card>
          <Card>
            <p className="text-sm text-zinc-500">読解</p>
            <p className="text-2xl font-bold">{result.readingScore}</p>
          </Card>
          <Card>
            <p className="text-sm text-zinc-500">聴解</p>
            <p className="text-2xl font-bold">{result.listeningScore}</p>
          </Card>
        </div>
        <Card className="mb-6">
          <CardTitle className="mb-2">合格予測</CardTitle>
          <p className="text-3xl font-bold text-brand">
            {Math.round(passProb * 100)}%
          </p>
        </Card>
        <Card>
          <CardTitle className="mb-4">弱点レーダー</CardTitle>
          <WeaknessRadar scores={weaknessScores} />
        </Card>
        <Button className="mt-6" onClick={() => setPhase("intro")}>
          もう一度
        </Button>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageHeader
        title={phase === "language" ? "言語知識・読解" : "聴解"}
        actions={<span className="font-mono text-zinc-500">{formatTime(seconds)}</span>}
      />
      <ProgressBar
        value={qIndex + 1}
        max={currentQs.length}
        className="mb-6"
      />
      {q && (
        <Card>
          <p className="mb-4">問題 {qIndex + 1}: {q.prompt}</p>
          {passageText && (
            <Card className="mb-4 bg-zinc-50 text-sm leading-relaxed dark:bg-zinc-800">
              <TokenizedPassage content={passageText} />
            </Card>
          )}
          {q.audioUrl && (
            <AudioPlayer src={q.audioUrl} examMode />
          )}
          <div className="mt-4 grid gap-2">
            {q.options.map((opt, i) => (
              <Button
                key={i}
                variant={answers[q.id] === i ? "primary" : "outline"}
                className="justify-start"
                onClick={() => setAnswers({ ...answers, [q.id]: i })}
              >
                {i + 1}. {opt}
              </Button>
            ))}
          </div>
          <div className="mt-6 flex gap-2">
            <Button
              variant="outline"
              disabled={qIndex === 0}
              onClick={() => setQIndex(qIndex - 1)}
            >
              前へ
            </Button>
            {qIndex < currentQs.length - 1 ? (
              <Button onClick={() => setQIndex(qIndex + 1)}>次へ</Button>
            ) : phase === "language" ? (
              <Button
                onClick={() => {
                  setPhase("listening");
                  setQIndex(0);
                  setSeconds(50 * 60);
                }}
              >
                聴解へ
              </Button>
            ) : (
              <Button onClick={finishExam}>提出</Button>
            )}
          </div>
        </Card>
      )}
    </MainLayout>
  );
}
