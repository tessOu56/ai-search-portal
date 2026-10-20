import { expect, type Page, test } from "@playwright/test";

/**
 * Flagship chat journey — golden ask → offline fixture → know→act links.
 * Prefer testids and hrefs over i18n copy. SSR chips are visible at
 * DOMContentLoaded; wait for the client effect marker before clicking.
 */

const WAIT_DOM = "domcontentloaded";
const PII_QUESTION = "Which datasets contain PII and what access do I need?";
const PII_RE = /PII/i;

async function waitForHydration(page: Page) {
  await expect(page.locator("html[data-hydrated='true']")).toBeAttached({
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
