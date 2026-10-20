import { expect, test } from "@playwright/test";

/**
 * Flagship search journey — URL contract + result handoff to metadata detail.
 * Assert machine-visible state (URL, asset id, testids), not i18n sentences.
 */

const WAIT_DOM = "domcontentloaded";
const CATALOG = "/catalog-search";

test.describe("catalog search journey", () => {
  test("query submits through the URL contract and links to asset detail", async ({
    page,
  }) => {
    await page.goto(CATALOG, { waitUntil: WAIT_DOM });
    await expect(page.getByTestId("route-error-shell")).toHaveCount(0);

    await page
      .getByRole("textbox", { name: /Catalog search query|目錄搜尋關鍵字/i })
      .fill("customer");
    await page.getByRole("button", { name: /^(Search|搜尋)$/ }).click();

    await expect(page).toHaveURL(/\/catalog-search\?/);
    await expect(page).toHaveURL(/q=customer/);
    const detail = page.getByRole("link", { name: /customer_profile/i });
    await expect(detail).toBeVisible({ timeout: 30_000 });
    await expect(detail).toHaveAttribute("href", /\/metadata\/tbl-customers/);

    await detail.click();
    await expect(page).toHaveURL(/\/metadata\/tbl-customers/);
    await expect(page.getByText("allow: false")).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText("need_approval: true")).toBeVisible();
  });

  test("type=Table is preserved on the URL and filters asset rows", async ({
    page,
  }) => {
    await page.goto(`${CATALOG}?q=customer&type=Table`, {
      waitUntil: WAIT_DOM,
    });
    await expect(page).toHaveURL(/type=Table/);
    await expect(page.getByText("type=Table")).toBeVisible({
      timeout: 30_000,
    });
    await expect(
      page.getByRole("link", { name: /customer_profile/i })
    ).toBeVisible();
  });
});
