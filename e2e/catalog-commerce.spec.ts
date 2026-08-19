import { expect, test } from "@playwright/test";

/**
 * Commerce facet smoke — catalog URL contract → knowledge section.
 * Asserts machine-visible state (URL + testids), not i18n copy.
 *
 * Requires Node 22+ (repo `.nvmrc`) for Playwright config ESM load.
 * Loader-level twin: `app/features/catalogsearch/catalog-commerce.smoke.test.ts`.
 */

const WAIT_DOM = "domcontentloaded";
const PACK = "pack=metalcraft-studio";

test.describe("catalog commerce facets", () => {
  test("productType=experience shows domain knowledge section", async ({
    page,
  }) => {
    await page.goto(`/catalog-search?productType=experience&${PACK}`, {
      waitUntil: WAIT_DOM,
    });
    await expect(page).toHaveURL(/productType=experience/);
    await expect(page.getByTestId("catalog-knowledge-section")).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText(/productType=experience/)).toBeVisible();
  });

  test("auctionEligible=true filters knowledge and preserves URL", async ({
    page,
  }) => {
    await page.goto(`/catalog-search?auctionEligible=true&${PACK}`, {
      waitUntil: WAIT_DOM,
    });
    await expect(page).toHaveURL(/auctionEligible=true/);
    await expect(page.getByTestId("catalog-knowledge-section")).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText(/row\(s\) · auctionEligible/)).toBeVisible();
  });

  test("invalid productType is stripped with facetWarning", async ({
    page,
  }) => {
    await page.goto(`/catalog-search?productType=not-a-type&${PACK}`, {
      waitUntil: WAIT_DOM,
    });
    await expect(
      page.getByRole("status").filter({ hasText: /Unknown productType/i })
    ).toBeVisible({
      timeout: 30_000,
    });
    // Loader clears activeProductType; UI must not treat the invalid value as active.
    await expect(page.getByText("productType=not-a-type")).toHaveCount(0);
  });
});
