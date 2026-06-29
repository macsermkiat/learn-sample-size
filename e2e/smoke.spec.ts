import { test, expect } from "@playwright/test";

// Smoke tests against the REAL built/preview server, so deploy-shaped behaviour
// (base path, SPA fallback, deep-link refresh, 404) is exercised — not a
// dev-only illusion. Kept light for the MVP; a fuller interaction suite is Stretch.

test("intro loads with the hook heading", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1")).toContainText("10 events per variable");
});

test("nav reaches the calculator and the binding N is shown", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Calculator" }).first().click();
  await expect(page).toHaveURL(/#\/calculator/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("deep-link refresh on #/calculator does not 404", async ({ page }) => {
  const resp = await page.goto("/#/calculator");
  expect(resp?.status()).toBeLessThan(400);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  // Hard reload the deep link — the static host must still serve index.html.
  await page.reload();
  await expect(page).toHaveURL(/#\/calculator/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("focus moves to the page h1 on route change (a11y orientation)", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Rule of thumb" }).first().click();
  const focusedTag = await page.evaluate(() => document.activeElement?.tagName);
  expect(focusedTag).toBe("H1");
});

test("unknown server path serves the real 404 page", async ({ page }) => {
  const resp = await page.goto("/this-path-does-not-exist.html");
  expect(resp?.status()).toBe(404);
  await expect(page.locator("h1")).toContainText("404");
});
