import { expect, test } from "@playwright/test";

/**
 * Flagship chat journey — golden ask → offline fixture → know→act links.
 * Prefer testids and hrefs over i18n copy.
 */

const WAIT_DOM = "domcontentloaded";
const PII_QUESTION = "Which datasets contain PII and what access do I need?";

test.describe("chat journey", () => {
  test("golden question chip opens a conversation and streams next actions", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: WAIT_DOM });
    await expect(page.getByTestId("route-error-shell")).toHaveCount(0);

    await page.getByTestId("golden-question").first().click();
    await expect(page.getByTestId("conversation-shell")).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByTestId("conversation-workspace")).toBeVisible();
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
    await expect(page.getByTestId("conversation-shell")).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText(PII_QUESTION).first()).toBeVisible();
    await expect(page.getByTestId("assistant-turn")).toBeVisible({
      timeout: 45_000,
    });
    await expect(page.getByTestId("chat-continue-request")).toBeVisible();
  });
});
