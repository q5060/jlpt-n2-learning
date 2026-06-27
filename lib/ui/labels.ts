import type { ReviewMode } from "@/lib/types";

export const REVIEW_MODE_LABELS: Record<ReviewMode, string> = {
  recognition: "認識",
  recall: "想起",
  cloze: "穴埋め",
  listening: "聴解",
};
