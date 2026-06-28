import { test, expect } from "@playwright/test";

/** Seed IndexedDB with placementCompleted before first navigation (avoids deleteDatabase + Dexie hang). */
async function seedPlacementCompleted(page: import("@playwright/test").Page, completed: boolean) {
  await page.addInitScript((placementCompleted: boolean) => {
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
              placementCompleted,
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
  }, completed);
}

test("redirects to placement when not completed", async ({ page }) => {
  await seedPlacementCompleted(page, false);
  await page.goto("/vocab", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/placement/, { timeout: 20000 });
  await expect(page.getByRole("heading", { name: "初回診断テスト", exact: true })).toBeVisible({
    timeout: 20000,
  });
});

test("allows settings without placement", async ({ page }) => {
  await seedPlacementCompleted(page, false);
  await page.goto("/settings", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "設定", exact: true })).toBeVisible({
    timeout: 20000,
  });
});
