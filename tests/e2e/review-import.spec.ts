import { test, expect } from "@playwright/test";

async function seedPlacementCompleted(page: import("@playwright/test").Page) {
  await page.addInitScript(async () => {
    const open = indexedDB.open("n2-study-db", 4);
    await new Promise<void>((resolve, reject) => {
      open.onerror = () => reject(open.error);
      open.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains("settings")) {
          db.createObjectStore("settings", { keyPath: "id" });
        }
      };
      open.onsuccess = () => {
        const db = open.result;
        const tx = db.transaction("settings", "readwrite");
        tx.objectStore("settings").put({
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
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => reject(tx.error);
      };
    });
  });
}

test.beforeEach(async ({ page }) => {
  await seedPlacementCompleted(page);
});

test("review queue page loads", async ({ page }) => {
  await page.goto("/review");
  await expect(page.getByRole("heading", { name: "復習キュー", exact: true })).toBeVisible({
    timeout: 15000,
  });
});

test("import page loads with history section", async ({ page }) => {
  await page.goto("/import");
  await expect(page.getByRole("heading", { name: "教材インポート", exact: true })).toBeVisible({
    timeout: 15000,
  });
  await expect(page.getByText("インポート履歴")).toBeVisible();
});
