import type { ExamQuestion, SkillTag } from "@/lib/types";

export const EXAM_SECTIONS = {
  language: {
    label: "言語知識（文字・語彙・文法）",
    timeMinutes: 0,
    subTime: 0,
  },
  reading: {
    label: "読解",
    timeMinutes: 0,
    subTime: 0,
  },
  combined: {
    label: "言語知識・読解",
    timeMinutes: 105,
  },
  listening: {
    label: "聴解",
    timeMinutes: 50,
  },
} as const;

export const PASS_LINE = {
  total: 90,
  section: 19,
  maxTotal: 180,
  maxSection: 60,
};

export function scoreExam(
  questions: ExamQuestion[],
  answers: Record<string, number>
): {
  languageScore: number;
  readingScore: number;
  listeningScore: number;
  totalScore: number;
  passed: boolean;
  breakdown: Record<SkillTag, { correct: number; total: number }>;
} {
  const breakdown: Record<SkillTag, { correct: number; total: number }> = {
    vocab: { correct: 0, total: 0 },
    kanji: { correct: 0, total: 0 },
    grammar: { correct: 0, total: 0 },
    reading: { correct: 0, total: 0 },
    listening: { correct: 0, total: 0 },
  };

  let languageCorrect = 0;
  let languageTotal = 0;
  let readingCorrect = 0;
  let readingTotal = 0;
  let listeningCorrect = 0;
  let listeningTotal = 0;

  for (const q of questions) {
    breakdown[q.skill].total++;
    const isCorrect = answers[q.id] === q.correctIndex;
    if (isCorrect) breakdown[q.skill].correct++;

    if (q.section === "language") {
      languageTotal++;
      if (isCorrect) languageCorrect++;
    } else if (q.section === "reading") {
      readingTotal++;
      if (isCorrect) readingCorrect++;
    } else {
      listeningTotal++;
      if (isCorrect) listeningCorrect++;
    }
  }

  const languageScore = Math.round(
    (languageCorrect / Math.max(languageTotal, 1)) * PASS_LINE.maxSection
  );
  const readingScore = Math.round(
    (readingCorrect / Math.max(readingTotal, 1)) * PASS_LINE.maxSection
  );
  const listeningScore = Math.round(
    (listeningCorrect / Math.max(listeningTotal, 1)) * PASS_LINE.maxSection
  );
  const totalScore = languageScore + readingScore + listeningScore;

  const passed =
    totalScore >= PASS_LINE.total &&
    languageScore >= PASS_LINE.section &&
    readingScore >= PASS_LINE.section &&
    listeningScore >= PASS_LINE.section;

  return {
    languageScore,
    readingScore,
    listeningScore,
    totalScore,
    passed,
    breakdown,
  };
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
