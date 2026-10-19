import type { ActionFunctionArgs } from "react-router";
import { describe, expect, it } from "vitest";

import { action } from "~/routes/api.context.pack-select";

const PACK_ID = "agri-supply";
const PACK_METADATA = `/metadata?pack=${PACK_ID}`;

async function postPackSelect(packId: string, redirectTo?: string) {
  const form = new FormData();
  form.set("packId", packId);
  if (redirectTo !== undefined) form.set("redirectTo", redirectTo);
  return action({
    request: new Request("http://localhost/api/context/pack-select", {
      method: "POST",
      body: form,
    }),
    params: {},
    context: {},
  } as ActionFunctionArgs);
}

describe("POST /api/context/pack-select — redirect guard", () => {
  it("stays on metadata and sets pack", async () => {
    const response = await postPackSelect(PACK_ID, "/metadata?type=Table");
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe(
      `/metadata?type=Table&pack=${PACK_ID}`
    );
  });

  it("rejects open-redirect redirectTo values", async () => {
    const response = await postPackSelect(PACK_ID, "//evil.com/metadata");
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe(PACK_METADATA);
  });

  it("does not treat /metadata-prefix as a metadata path", async () => {
    const response = await postPackSelect(PACK_ID, "/metadata-leak");
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe(PACK_METADATA);
  });
});
