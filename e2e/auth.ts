import { expect, type Page } from "@playwright/test";

/** Align with `.env.example` local demo tokens and Playwright webServer env. */
export const E2E_ADMIN_TOKEN = process.env.ADMIN_API_TOKEN ?? "dev-admin-token";
export const E2E_REVIEWER_TOKEN =
  process.env.REVIEWER_API_TOKEN ?? "dev-reviewer-token";
export const E2E_REQUESTER_TOKEN =
  process.env.REQUESTER_API_TOKEN ?? "dev-requester-token";

export async function signIn(page: Page, token: string): Promise<void> {
  const res = await page.request.post("/api/auth/session", {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(res.ok(), `sign-in failed: ${res.status()}`).toBeTruthy();
}
