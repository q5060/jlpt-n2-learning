import { SKILL_LABELS } from "@/lib/weakness/engine";
import type { SkillTag } from "@/lib/types";

export function WeaknessRadar({
  scores,
}: {
  scores: Record<SkillTag, number>;
}) {
  const skills: SkillTag[] = [
    "vocab",
    "kanji",
    "grammar",
    "reading",
    "listening",
  ];

  return (
    <div className="space-y-3">
      {skills.map((skill) => (
        <div key={skill}>
          <div className="mb-1 flex justify-between text-sm">
            <span>{SKILL_LABELS[skill]}</span>
            <span className="text-zinc-500">
              弱点 {Math.round(scores[skill] * 100)}%
            </span>
          </div>
          <div
            className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800"
            role="progressbar"
            aria-valuenow={Math.round(scores[skill] * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${SKILL_LABELS[skill]}の弱点度`}
          >
            <div
              className="h-full rounded-full bg-warning"
              style={{ width: `${scores[skill] * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
