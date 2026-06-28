import type { ReviewMode } from "@/lib/types";

export const REVIEW_MODE_LABELS: Record<ReviewMode, string> = {
  recognition: "認識",
  recall: "想起",
  cloze: "穴埋め",
  listening: "聴解",
};

export const NAV_LABELS = {
  reviewQueue: "復習キュー",
  mixedReview: "混合復習",
  vocabReview: "単語・漢字復習",
  studyHub: "学習ハブ",
} as const;
