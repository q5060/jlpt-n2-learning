"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/db/local/schema";

export function StudyTimeChart() {
  const [sessions, setSessions] = useState<{ date: string; minutes: number }[]>([]);

  useEffect(() => {
    db.studySessions.orderBy("date").reverse().limit(14).toArray().then((s) => {
      setSessions(s.reverse().map((x) => ({ date: x.date.slice(5), minutes: x.minutes })));
    });
  }, []);

  if (sessions.length === 0) {
    return <p className="text-sm text-zinc-500">学習時間の記録がありません</p>;
  }

  const max = Math.max(...sessions.map((s) => s.minutes), 1);
  const total = sessions.reduce((a, s) => a + s.minutes, 0);

  return (
    <div>
      <p className="mb-2 text-sm text-zinc-500">累計 {total} 分（直近14日）</p>
      <div className="flex h-24 items-end gap-1">
        {sessions.map((s) => (
          <div key={s.date} className="flex flex-1 flex-col items-center gap-1">
            <div
              className="w-full rounded-t bg-brand"
              style={{ height: `${(s.minutes / max) * 100}%`, minHeight: s.minutes > 0 ? 4 : 0 }}
              title={`${s.date}: ${s.minutes}分`}
            />
            <span className="text-[9px] text-zinc-400">{s.date}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
