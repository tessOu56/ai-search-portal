import { expect, type Page, test } from "@playwright/test";

const WAIT = "domcontentloaded";
const ERROR_COPY = "出了點問題";
const DEPTH = "Maximum update depth";

const NAV_HREFS = [
  "/?view=dashboard",
  "/catalog-search",
  "/catalog-search/dictionary",
  "/metadata",
  "/access-requests/review?sessionRole=owner",
  "/my-apis?sessionRole=requester",
  "/insights",
  "/items",
  "/dishes",
  "/recipes",
  "/vitals",
  "/release-notes",
];

const DETAIL_HREFS = [
  "/metadata/tbl-customers?purpose=marketing&role=analyst",
  "/dishes/dish-three-cup-chicken",
  "/items/1",
  "/release-notes/1.0.0",
];

async function assertHealthy(page: Page) {
  await expect(page.getByText(ERROR_COPY)).toHaveCount(0);
  await expect(page.getByText(DEPTH)).toHaveCount(0);
}

test.describe("surface smoke", () => {
  test("removed planning and create paths 404", async ({ page }) => {
    for (const path of ["/site-map", "/items/new"]) {
      const response = await page.goto(path, { waitUntil: WAIT });
      expect(response?.status(), path).toBe(404);
    }
  });

  test("experience destinations and details render without the error shell", async ({
    page,
  }) => {
    for (const href of [...NAV_HREFS, ...DETAIL_HREFS]) {
      await page.goto(href, { waitUntil: WAIT });
      await assertHealthy(page);
    }
  });

  test("deep routes mark Overview current and omit create/detail nav rows", async ({
    page,
  }) => {
    await page.goto("/catalog-search", { waitUntil: WAIT });
    const topbar = page.getByTestId("workspace-topbar");
    await expect(
      topbar.getByRole("link", { name: /Overview|總覽/ })
    ).toHaveAttribute("aria-current", "page");
    await expect(
      page.getByRole("link", { name: /Catalog search|目錄搜尋/ })
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "New item" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Item detail" })).toHaveCount(
      0
    );
    await expect(page.getByRole("link", { name: "Dish detail" })).toHaveCount(
      0
    );
    await expect(page.getByRole("link", { name: /^Site map/ })).toHaveCount(0);
  });

  test("375 topbar stays one row of icons", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/dishes", { waitUntil: WAIT });
    const topbar = page.getByTestId("workspace-topbar");
    await expect(topbar).toBeVisible();
    const box = await topbar.boundingBox();
    expect(box?.height ?? 99).toBeLessThan(72);
    await expect(topbar.getByRole("link", { name: /Ask|提問/ })).toBeVisible();
    await expect(
      topbar.getByRole("link", { name: /Overview|總覽/ })
    ).toBeVisible();
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });
});
