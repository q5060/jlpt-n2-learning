import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(async () => {
    const open = indexedDB.open("n2-study-db", 4);
    await new Promise<void>((resolve, reject) => {
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
});

test("dashboard loads", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "ダッシュボード", exact: true })).toBeVisible({
    timeout: 15000,
  });
});

test("vocab page loads", async ({ page }) => {
  await page.goto("/vocab");
  await expect(page.getByRole("heading", { name: "単語学習" })).toBeVisible({
    timeout: 15000,
  });
});

test("grammar list loads", async ({ page }) => {
  await page.goto("/grammar", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "文法一覧" })).toBeVisible({
    timeout: 15000,
  });
});

test("exam intro loads", async ({ page }) => {
  await page.goto("/exam");
  await expect(page.getByRole("heading", { name: "JLPT N2 模擬試験" })).toBeVisible({
    timeout: 15000,
  });
});
