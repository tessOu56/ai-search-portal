import { expect, type Page, test } from "@playwright/test";

/**
 * T-2026-068 — review center approve / edit / reject (Journey C continuation).
 *
 * Asserts lifecycle + audit side effects, not UI copy sentences.
 */

const PII_ASSET = "/metadata/tbl-customers";
const WAIT_DOM = "domcontentloaded";
const REVIEW_URL = "/access-requests/review?sessionRole=owner";
const PENDING = "pending_approval";
const AUDIT_API = "/api/audit?limit=20";

async function submitPendingApproval(page: Page) {
  await page.goto(`${PII_ASSET}?purpose=marketing&role=analyst`, {
    waitUntil: WAIT_DOM,
  });
  await expect(page.getByText("need_approval: true")).toBeVisible({
    timeout: 30_000,
  });
  await page.getByRole("link", { name: "Request access" }).click();
  await expect(page).toHaveURL(/confirm=1/);
  await page.getByRole("button", { name: "Confirm" }).click();
  const status = page.getByRole("status");
  await expect(status).toContainText(PENDING);
}

test.describe("access review center (T-068)", () => {
  test("approve path: pending → approved + audit decision_id", async ({
    page,
  }) => {
    await submitPendingApproval(page);

    await page.goto(REVIEW_URL, { waitUntil: WAIT_DOM });
    await expect(
      page.getByRole("heading", { name: "Access review" })
    ).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText(PENDING).first()).toBeVisible();

    await page.getByRole("button", { name: "Approve" }).first().click();
    await expect(
      page.getByRole("status").filter({ hasText: "approved" })
    ).toBeVisible();

    const audit = await page.request.get(AUDIT_API);
    expect(audit.ok()).toBeTruthy();
    const body = (await audit.json()) as {
      data: Array<{
        action: string;
        decisionId?: string;
        outcome?: string;
      }>;
    };
    const approveEvent = body.data.find(
      (e) => e.action === "access_request.approve" && e.outcome === "approved"
    );
    expect(approveEvent).toBeTruthy();
    expect(approveEvent?.decisionId).toBeTruthy();
  });

  test("reject path: pending → denied + audit", async ({ page }) => {
    await submitPendingApproval(page);

    await page.goto(REVIEW_URL, { waitUntil: WAIT_DOM });
    await expect(page.getByText(PENDING).first()).toBeVisible({
      timeout: 30_000,
    });

    await page.getByRole("button", { name: "Reject" }).first().click();
    await expect(
      page.getByRole("status").filter({ hasText: "denied" })
    ).toBeVisible();

    const audit = await page.request.get(AUDIT_API);
    const body = (await audit.json()) as {
      data: Array<{ action: string; outcome?: string; decisionId?: string }>;
    };
    const denyEvent = body.data.find(
      (e) => e.action === "access_request.deny" && e.outcome === "denied"
    );
    expect(denyEvent?.decisionId).toBeTruthy();
  });

  test("edit path: pending stays pending with updated purpose", async ({
    page,
  }) => {
    await submitPendingApproval(page);

    await page.goto(REVIEW_URL, { waitUntil: WAIT_DOM });
    await expect(page.getByText(PENDING).first()).toBeVisible({
      timeout: 30_000,
    });

    const card = page.locator("li").filter({ hasText: PENDING }).first();
    await card.getByRole("button", { name: "Edit purpose" }).click();
    await card.getByRole("option", { name: "operations" }).click();
    await card.getByRole("button", { name: "Edit role" }).click();
    await card.getByRole("option", { name: "engineer" }).click();
    await card.getByRole("button", { name: "Edit", exact: true }).click();

    await expect(
      page.getByRole("status").filter({ hasText: "edited" })
    ).toBeVisible();
    await expect(page.getByText("operations · engineer").first()).toBeVisible();
    await expect(page.getByText(PENDING).first()).toBeVisible();

    const audit = await page.request.get(AUDIT_API);
    const body = (await audit.json()) as {
      data: Array<{ action: string; outcome?: string; decisionId?: string }>;
    };
    const editEvent = body.data.find(
      (e) => e.action === "access_request.edit" && e.outcome === "edited"
    );
    expect(editEvent?.decisionId).toBeTruthy();
  });
});
