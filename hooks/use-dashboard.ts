"use client";

import { useEffect, useState, useCallback } from "react";
import { generateDailyTasks } from "@/lib/curriculum/schedule";
import { getDueCount } from "@/lib/srs/fsrs";
import { getSettings, db } from "@/lib/db/local/schema";
import { getWeaknessScores } from "@/lib/weakness/engine";
import type { DailyTask, WeaknessScore } from "@/lib/types";

export function useDashboard() {
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [dueCount, setDueCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [weakness, setWeakness] = useState<WeaknessScore[]>([]);
  const [week, setWeek] = useState(1);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [t, due, settings, w, sessions] = await Promise.all([
      generateDailyTasks(),
      getDueCount(),
      getSettings(),
      getWeaknessScores(),
      db.studySessions.orderBy("date").reverse().limit(30).toArray(),
    ]);

    setTasks(t);
    setDueCount(due);
    setWeek(
      Math.min(
        26,
        Math.max(
          1,
          Math.ceil(
            (Date.now() - new Date(settings.startDate).getTime()) /
              (7 * 24 * 60 * 60 * 1000)
          )
        )
      )
    );

    const weaknessArr = Object.entries(w).map(([skill, score]) => ({
      skill: skill as WeaknessScore["skill"],
      score,
      totalAttempts: 0,
      correctAttempts: 0,
    }));
    setWeakness(weaknessArr);

    let s = 0;
    const today = new Date().toISOString().split("T")[0];
    const dates = new Set(sessions.map((x) => x.date));
    let d = new Date();
    while (dates.has(d.toISOString().split("T")[0])) {
      s++;
      d.setDate(d.getDate() - 1);
    }
    if (!dates.has(today) && s === 0) setStreak(0);
    else setStreak(s);

    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { tasks, dueCount, streak, weakness, week, loading, refresh };
}
