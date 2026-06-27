"use client";

export function PassProbabilityChart({
  data,
}: {
  data: { date: string; probability: number }[];
}) {
  if (data.length === 0) {
    return <p className="text-sm text-zinc-500">模擬試験を受けると曲線が表示されます</p>;
  }

  const w = 320;
  const h = 120;
  const pad = 20;
  const points = data.map((d, i) => {
    const x = pad + (i / Math.max(data.length - 1, 1)) * (w - pad * 2);
    const y = h - pad - d.probability * (h - pad * 2);
    return `${x},${y}`;
  });

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full max-w-md">
      <polyline
        fill="none"
        stroke="var(--color-brand)"
        strokeWidth="2"
        points={points.join(" ")}
      />
      {data.map((d, i) => {
        const x = pad + (i / Math.max(data.length - 1, 1)) * (w - pad * 2);
        const y = h - pad - d.probability * (h - pad * 2);
        return <circle key={i} cx={x} cy={y} r="3" fill="var(--color-brand)" />;
      })}
      <text x={pad} y={h - 4} className="fill-zinc-400 text-[8px]">
        0%
      </text>
      <text x={pad} y={pad} className="fill-zinc-400 text-[8px]">
        100%
      </text>
    </svg>
  );
}
