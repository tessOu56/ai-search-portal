import type { ActionFunctionArgs } from "react-router";
import { describe, expect, it } from "vitest";

import { action } from "~/routes/api.locale";

async function postLocale(next: string | null, referer?: string) {
  const form = new FormData();
  form.set("locale", "en");
  if (next !== null) form.set("next", next);
  const headers = new Headers();
  if (referer) headers.set("Referer", referer);
  return await action({
    request: new Request("http://localhost/api/locale", {
      method: "POST",
      body: form,
      headers,
    }),
    params: {},
    context: {},
  } as ActionFunctionArgs);
}

describe("POST /api/locale — open-redirect guard", () => {
  it("keeps in-app next paths", async () => {
    const response = await postLocale("/catalog-search?q=pii");
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/catalog-search?q=pii");
  });

  it("rejects protocol-relative next targets", async () => {
    const response = await postLocale("//evil.com/phish");
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/");
  });

  it("ignores foreign Referer when next is omitted", async () => {
    const response = await postLocale(null, "https://evil.com/phish");
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/");
  });

  it("uses same-origin Referer when next is omitted", async () => {
    const response = await postLocale(
      null,
      "http://localhost/access-requests/review?sessionRole=owner"
    );
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe(
      "/access-requests/review?sessionRole=owner"
    );
  });
});
