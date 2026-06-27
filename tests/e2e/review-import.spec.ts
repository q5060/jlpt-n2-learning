import { test, expect } from "@playwright/test";

test("review queue page loads", async ({ page }) => {
  await page.goto("/review");
  await expect(page.getByRole("heading", { name: "復習キュー" })).toBeVisible({
    timeout: 15000,
  });
});

test("import page loads with history section", async ({ page }) => {
  await page.goto("/import");
  await expect(page.getByRole("heading", { name: "教材インポート" })).toBeVisible({
    timeout: 15000,
  });
  await expect(page.getByText("インポート履歴")).toBeVisible();
});
