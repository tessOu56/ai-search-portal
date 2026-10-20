import { expect, type Page, test } from "@playwright/test";

/**
 * Flagship chat journey — golden ask → offline fixture → know→act links.
 * Prefer testids and hrefs over i18n copy. Wait for client hydration before
 * clicking chips: SSR markup is visible at DOMContentLoaded, but onClick is not
 * attached until HydratedRouter has created the data router.
 */

const WAIT_DOM = "domcontentloaded";
const PII_QUESTION = "Which datasets contain PII and what access do I need?";
const PII_RE = /PII/i;

async function waitForHydration(page: Page) {
  await page.waitForFunction("() => Boolean(window.__reactRouterDataRouter)", {
    timeout: 30_000,
  });
}

test.describe("chat journey", () => {
  test("golden question chip opens a conversation and streams next actions", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: WAIT_DOM });
    await expect(page.getByTestId("route-error-shell")).toHaveCount(0);
    await waitForHydration(page);
    // Typewriter hint is filled in a client effect — extra proof effects ran.
    await expect(page.getByTestId("composer-hint")).not.toHaveText("", {
      timeout: 30_000,
    });

    const chip = page
      .getByTestId("golden-question")
      .filter({ hasText: PII_RE });
    await expect(chip).toBeVisible();
    await chip.click();

    await expect(page.getByTestId("conversation-shell")).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByTestId("conversation-workspace")).toBeVisible();
    await expect(page.getByTestId("user-turn")).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByTestId("assistant-turn")).toBeVisible({
      timeout: 45_000,
    });

    const nextAction = page.getByTestId("chat-next-action").first();
    await expect(nextAction).toBeVisible({ timeout: 30_000 });
    await expect(nextAction).toHaveAttribute(
      "href",
      /\/metadata\/tbl-customers/
    );
  });

  test("?q= deep-link auto-submits the pending query", async ({ page }) => {
    await page.goto(`/?q=${encodeURIComponent(PII_QUESTION)}`, {
      waitUntil: WAIT_DOM,
    });
    await waitForHydration(page);
    await expect(page.getByTestId("conversation-shell")).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByTestId("conversation-workspace")).toBeVisible();
    await expect(page.getByTestId("user-turn")).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByTestId("assistant-turn")).toBeVisible({
      timeout: 45_000,
    });
    await expect(page.getByTestId("chat-continue-request")).toBeVisible({
      timeout: 45_000,
    });
  });
});
