import { expect, test } from "@playwright/test";

/**
 * Main user journey glue: catalog search → result detail → access request HITL.
 * Status-machine coverage stays in access-request.spec.ts; this file only
 * asserts the handoff from search into the confirm URL.
 */

const WAIT_DOM = "domcontentloaded";

test.describe("search to access request", () => {
  test("catalog result opens HITL confirm for PII", async ({ page }) => {
    await page.goto("/catalog-search?q=customer", { waitUntil: WAIT_DOM });
    await page.getByRole("link", { name: /customer_profile/i }).click();
    await expect(page).toHaveURL(/\/metadata\/tbl-customers/);

    await expect(page.getByText("need_approval: true")).toBeVisible({
      timeout: 30_000,
    });
    await page.getByRole("link", { name: /Request access|申請存取/i }).click();
    await expect(page).toHaveURL(/confirm=1/);
    await page.getByRole("button", { name: /^(Confirm|確認)/ }).click();

    const status = page.getByRole("status");
    await expect(status).toBeVisible();
    await expect(status).toContainText("pending_approval");
  });
});
