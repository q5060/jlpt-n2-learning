import { db } from "@/lib/db/local/schema";

export async function logStudyMinutes(
  minutes: number,
  cardsReviewed = 0
): Promise<void> {
  if (minutes <= 0 && cardsReviewed <= 0) return;
  const today = new Date().toISOString().split("T")[0];
  const session = await db.studySessions.get(today);
  if (session) {
    await db.studySessions.put({
      ...session,
      minutes: session.minutes + minutes,
      cardsReviewed: session.cardsReviewed + cardsReviewed,
    });
  } else {
    await db.studySessions.put({
      id: today,
      date: today,
      minutes: Math.max(minutes, 0),
      cardsReviewed: Math.max(cardsReviewed, 0),
    });
  }
}
