import { expect, test } from "@playwright/test";

/**
 * Metadata result-detail journey — policy machine values, lineage, list search.
 */

const WAIT_DOM = "domcontentloaded";
const CUSTOMERS = "/metadata/tbl-customers?purpose=marketing&role=analyst";

test.describe("metadata result detail", () => {
  test("PII asset shows HITL policy, lineage, and access request entry", async ({
    page,
  }) => {
    await page.goto(CUSTOMERS, { waitUntil: WAIT_DOM });
    await expect(page.getByTestId("route-error-shell")).toHaveCount(0);

    await expect(page.getByText("allow: false")).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText("need_approval: true")).toBeVisible();
    await expect(page.getByTestId("policy-debug-drawer")).toBeVisible();
    await expect(page.getByTestId("asset-faq")).toBeVisible();

    await page.getByTestId("policy-debug-drawer").locator("summary").click();
    await expect(page.getByText(/decision_id:/)).toBeVisible();
    await expect(page.getByText(/masked fields:/)).toBeVisible();

    await expect(
      page.getByRole("link", { name: /Request access|申請存取/i })
    ).toBeVisible();
  });

  test("metadata list query finds the same asset", async ({ page }) => {
    await page.goto("/metadata?q=customer", { waitUntil: WAIT_DOM });
    await expect(page).toHaveURL(/q=customer/);
    const detail = page.getByRole("link", { name: /customer_profile/i });
    await expect(detail).toBeVisible({ timeout: 30_000 });
    await expect(detail).toHaveAttribute("href", /\/metadata\/tbl-customers/);
  });

  test("unknown asset returns the route error shell", async ({ page }) => {
    const response = await page.goto("/metadata/missing-asset", {
      waitUntil: WAIT_DOM,
    });
    expect(response?.status()).toBe(404);
    await expect(page.getByTestId("route-error-shell")).toBeVisible();
  });
});
