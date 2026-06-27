import {
  getExamById,
  getGrammarById,
  getListeningById,
  getReadingById,
} from "@/lib/content/loader";
import type {
  ExamQuestion,
  GrammarExercise,
  ListeningItem,
  ReadingPassage,
  ReadingQuestion,
} from "@/lib/types";

export type ResolvedReviewItem =
  | { kind: "exam"; question: ExamQuestion }
  | { kind: "grammar"; grammarId: string; exercise: GrammarExercise }
  | {
      kind: "reading";
      passage: ReadingPassage;
      question: ReadingQuestion;
    }
  | { kind: "listening"; item: ListeningItem; questionIndex: number };

export async function resolveReviewItem(
  contentId: string,
  contentType: string,
  exerciseId?: string
): Promise<ResolvedReviewItem | null> {
  if (contentId.startsWith("eq") || contentType === "exam") {
    const question = await getExamById(contentId);
    if (question) return { kind: "exam", question };
  }

  if (contentId.startsWith("g") || contentType === "grammar") {
    const grammar = await getGrammarById(contentId);
    if (!grammar) return null;
    const exercise =
      grammar.exercises.find((e) => e.id === exerciseId) ??
      grammar.exercises[0];
    if (!exercise) return null;
    return { kind: "grammar", grammarId: contentId, exercise };
  }

  if (contentId.startsWith("r") || contentType === "reading") {
    const passage = await getReadingById(contentId);
    if (!passage) return null;
    const question =
      passage.questions.find((q) => q.id === exerciseId) ??
      passage.questions[0];
    return { kind: "reading", passage, question };
  }

  if (contentId.startsWith("l") || contentType === "listening") {
    const item = await getListeningById(contentId);
    if (!item) return null;
    const questionIndex = exerciseId
      ? item.questions.findIndex((q) => q.id === exerciseId)
      : 0;
    return { kind: "listening", item, questionIndex: Math.max(0, questionIndex) };
  }

  return null;
}

export async function getContentLabel(
  contentId: string,
  _skill: string
): Promise<string> {
  if (contentId.startsWith("g")) {
    const g = await getGrammarById(contentId);
    return g?.title ?? contentId;
  }
  if (contentId.startsWith("r")) {
    const r = await getReadingById(contentId);
    return r?.title ?? contentId;
  }
  if (contentId.startsWith("l")) {
    const l = await getListeningById(contentId);
    return l?.title ?? contentId;
  }
  if (contentId.startsWith("eq")) {
    const q = await getExamById(contentId);
    return q?.prompt.slice(0, 30) ?? contentId;
  }
  return contentId;
}
