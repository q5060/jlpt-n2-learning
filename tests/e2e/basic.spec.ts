import { test, expect } from "@playwright/test";

test("dashboard loads", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "ダッシュボード" })).toBeVisible({
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
