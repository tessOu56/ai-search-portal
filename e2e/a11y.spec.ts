import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

const WAIT = "domcontentloaded";

const ROUTES = [
  { name: "home", path: "/" },
  { name: "catalog-search", path: "/catalog-search" },
  { name: "metadata", path: "/metadata" },
  { name: "insights", path: "/insights" },
] as const;

async function assertNoCriticalViolations(page: Page, name: string) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .disableRules(["color-contrast"])
    .analyze();

  const serious = results.violations.filter(
    (violation) =>
      violation.impact === "critical" || violation.impact === "serious"
  );

  expect(
    serious,
    `${name}: ${serious
      .map(
        (violation) =>
          `${violation.id} (${violation.nodes.length}) ${violation.help}`
      )
      .join("; ")}`
  ).toEqual([]);
}

test.describe("axe-core a11y", () => {
  for (const route of ROUTES) {
    test(`${route.name} has no serious axe violations`, async ({ page }) => {
      await page.goto(route.path, { waitUntil: WAIT });
      await expect(page.getByTestId("route-error-shell")).toHaveCount(0);
      await assertNoCriticalViolations(page, route.name);
    });
  }

  test("chat after a turn stays keyboard-labelled and axe-clean", async ({
    page,
  }) => {
    await page.goto(
      `/?q=${encodeURIComponent(
        "Which datasets contain PII and what access do I need?"
      )}`,
      { waitUntil: WAIT }
    );
    await expect(page.getByTestId("conversation-workspace")).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByTestId("assistant-turn")).toBeVisible({
      timeout: 45_000,
    });
    await expect(page.getByLabel(/Ask a question|提問/)).toBeVisible();
    await assertNoCriticalViolations(page, "chat-with-turn");
  });

  test("skip link is the first tab stop and lands in main", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: WAIT });
    await page.keyboard.press("Tab");
    const skip = page.locator(":focus");
    await expect(skip).toHaveAttribute("href", "#main-content");
    await skip.press("Enter");
    await expect(page.locator("#main-content")).toBeFocused();
  });

  test("catalog results expose selected filters and a search label", async ({
    page,
  }) => {
    await page.goto("/catalog-search", { waitUntil: WAIT });
    await expect(
      page.getByRole("textbox", { name: /Catalog search query|目錄搜尋/ })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /All|全部/, exact: true }).first()
    ).toHaveAttribute("aria-current", "true");

    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    const focused = page.locator(":focus");
    await expect(focused).toBeVisible();
  });
});
