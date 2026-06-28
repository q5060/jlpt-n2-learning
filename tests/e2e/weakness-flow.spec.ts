import { test, expect } from "@playwright/test";

test("reading list loads with placement completed", async ({ page }) => {
  await page.addInitScript(() => {
    const open = indexedDB.open("n2-study-db", 4);
    return new Promise<void>((resolve, reject) => {
      open.onerror = () => reject(open.error);
      open.onsuccess = () => {
        const db = open.result;
        db.transaction("settings", "readwrite")
          .objectStore("settings")
          .put({
            id: "main",
            data: {
              dailyGoalMinutes: 75,
              newCardsPerDay: 20,
              reviewCardsPerDay: 100,
              startDate: new Date().toISOString().split("T")[0],
              placementCompleted: true,
              audioPackDownloaded: false,
            },
          });
        db.close();
        resolve();
      };
      open.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains("settings")) {
          db.createObjectStore("settings", { keyPath: "id" });
        }
      };
    });
  });
  await page.goto("/reading", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "読解練習" })).toBeVisible({
    timeout: 15000,
  });
});
