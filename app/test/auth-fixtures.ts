export const TEST_ADMIN_TOKEN = "test-admin-token";
export const TEST_REVIEWER_TOKEN = "test-reviewer-token";
export const TEST_REQUESTER_TOKEN = "test-requester-token";

export function applyTestAuthEnv(): void {
  process.env.ADMIN_API_TOKEN = TEST_ADMIN_TOKEN;
  process.env.REVIEWER_API_TOKEN = TEST_REVIEWER_TOKEN;
  process.env.REQUESTER_API_TOKEN = TEST_REQUESTER_TOKEN;
  process.env.RATE_LIMIT_DISABLED = "1";
}

export function bearer(token: string): string {
  return `Bearer ${token}`;
}

export function authHeaders(token = TEST_REQUESTER_TOKEN): HeadersInit {
  return {
    Authorization: bearer(token),
    "Content-Type": "application/json",
  };
}
