import { test, expect } from "@playwright/test";

async function seedPlacementCompleted(page: import("@playwright/test").Page) {
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
}

test("review page loads with skill filter", async ({ page }) => {
  await seedPlacementCompleted(page);
  await page.goto("/review?skill=vocab", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "復習キュー", exact: true })).toBeVisible({
    timeout: 15000,
  });
});

test("review page loads with contentId filter", async ({ page }) => {
  await seedPlacementCompleted(page);
  await page.goto("/review?skill=reading&contentId=r001", {
    waitUntil: "domcontentloaded",
  });
  await expect(page.getByRole("heading", { name: "復習キュー", exact: true })).toBeVisible({
    timeout: 15000,
  });
});
