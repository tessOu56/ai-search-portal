import { expect, test } from "@playwright/test";

/**
 * T-2026-015 — manual access-request baseline path (Journey C, governance).
 *
 * Assertion philosophy: state & side effects, not UI copy.
 * - Policy decision state is driven by the URL contract (?purpose= &role=)
 *   and rendered as machine values (allow: true/false, need_approval: ...).
 * - Submission outcome is asserted against the access-request status machine
 *   (specs/domain/metadata-access.yaml): approved | pending_approval | denied,
 *   plus the audit side effect flag — never against full sentence copy.
 *
 * Fixtures (content/context-packs/enterprise-mau/assets.json):
 * - tbl-customers  classification=PII
 * - dash-orders    classification=confidential (require_audit)
 */

const PII_ASSET = "/metadata/tbl-customers";
const REQUEST_ACCESS = "Request access";
const CONFIRM = "Confirm";
const REVIEW_AI_REQUEST = "Review AI request";
const CONFIRM_AI_REQUEST = "Confirm AI request";
const WAIT_DOM = "domcontentloaded";
const NEED_APPROVAL_TRUE = "need_approval: true";

test.describe("manual access-request path", () => {
  test("HITL path: analyst + marketing on PII → need_approval → pending_approval", async ({
    page,
  }) => {
    // URL contract drives policy state: marketing + PII → need_approval.
    await page.goto(`${PII_ASSET}?purpose=marketing&role=analyst`, {
      waitUntil: WAIT_DOM,
    });

    // State assertion: policy decision values (machine state, not copy).
    await expect(page.getByText("allow: false")).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText(NEED_APPROVAL_TRUE)).toBeVisible();

    // Manual path: Request access is a Link → ?confirm=1 (URL-driven HITL).
    await page.getByRole("link", { name: REQUEST_ACCESS }).click();
    await expect(page).toHaveURL(/confirm=1/);
    await page.getByRole("button", { name: CONFIRM }).click();

    // Side-effect assertion: status machine lands on pending_approval.
    const status = page.getByRole("status");
    await expect(status).toBeVisible();
    await expect(status).toContainText("pending_approval");
  });

  test("auto-approve path: data_admin on PII → allow → approved", async ({
    page,
  }) => {
    await page.goto(`${PII_ASSET}?purpose=analytics&role=data_admin`, {
      waitUntil: WAIT_DOM,
    });

    await expect(page.getByText("allow: true")).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText("need_approval: false")).toBeVisible();

    await page.getByRole("link", { name: REQUEST_ACCESS }).click();
    await expect(page).toHaveURL(/confirm=1/);
    await page.getByRole("button", { name: CONFIRM }).click();

    const status = page.getByRole("status");
    await expect(status).toContainText("approved");
    await expect(status).not.toContainText("pending_approval");
  });

  test("audit side effect: confidential asset flags audit in the outcome", async ({
    page,
  }) => {
    await page.goto("/metadata/dash-orders?purpose=analytics&role=data_admin", {
      waitUntil: WAIT_DOM,
    });

    await page.getByRole("link", { name: REQUEST_ACCESS }).click({
      timeout: 30_000,
    });
    await expect(page).toHaveURL(/confirm=1/);
    await page.getByRole("button", { name: CONFIRM }).click();

    // require_audit(confidential) must surface as an audit side effect.
    const status = page.getByRole("status");
    await expect(status).toContainText("audit: true");
  });

  test("policy state is URL-driven: same asset, different role flips decision", async ({
    page,
  }) => {
    await page.goto(`${PII_ASSET}?purpose=marketing&role=analyst`, {
      waitUntil: WAIT_DOM,
    });
    await expect(page.getByText(NEED_APPROVAL_TRUE)).toBeVisible({
      timeout: 30_000,
    });

    await page.goto(`${PII_ASSET}?purpose=analytics&role=data_admin`, {
      waitUntil: WAIT_DOM,
    });
    await expect(page.getByText("allow: true")).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText("need_approval: false")).toBeVisible();
  });
});

test.describe("AI-assisted access-request path", () => {
  test("AI fill path validates payload, requires HITL, and submits after confirm", async ({
    page,
  }) => {
    await page.goto(`${PII_ASSET}?aiFill=1`, {
      waitUntil: WAIT_DOM,
    });

    await expect(page.getByText("AI-assisted access request")).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText("purpose: marketing")).toBeVisible();
    await expect(page.getByText(NEED_APPROVAL_TRUE)).toBeVisible();

    await page.getByRole("link", { name: REVIEW_AI_REQUEST }).click();
    await expect(page).toHaveURL(/aiFill=1/);
    await expect(page).toHaveURL(/confirm=1/);

    await expect(
      page.getByText("Review AI-generated request before submit")
    ).toBeVisible();
    await page.getByRole("button", { name: CONFIRM_AI_REQUEST }).click();

    const status = page.getByRole("status");
    await expect(status).toBeVisible();
    await expect(status).toContainText("pending_approval");
  });

  test("simulated agent failure shows fallback instead of rendering invalid payload", async ({
    page,
  }) => {
    await page.goto(`${PII_ASSET}?aiFill=invalid`, {
      waitUntil: WAIT_DOM,
    });

    await expect(page.getByTestId("ai-fallback-panel")).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByRole("alert")).toContainText(
      "AI-generated access request failed validation."
    );
    await expect(
      page.getByRole("link", { name: REVIEW_AI_REQUEST })
    ).toHaveCount(0);
  });
});
