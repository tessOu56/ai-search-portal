/**
 * 極輕量行為閘門：handler 回傳須通過契約（Zod SoT）且符合 OpenAPI 衍生型別。
 * 見 specs/README.md、docs/adr/spec-driven-contracts-and-sot.md
 */

import {
  listItemsResponseSchema,
  type paths,
} from "@ai-search-portal/contracts";
import { describe, expect, it } from "vitest";

import { app } from "./app.js";

describe("Items API behavioral gate", () => {
  it("GET /api/items matches Zod and OpenAPI-derived list response type", async () => {
    const res = await app.request("/api/items");
    expect(res.status).toBe(200);
    const json: unknown = await res.json();
    const parsed = listItemsResponseSchema.safeParse(json);
    expect(parsed.success).toBe(true);
    type ListOk =
      paths["/api/items"]["get"]["responses"]["200"]["content"]["application/json"];
    const typed: ListOk = listItemsResponseSchema.parse(json);
    expect(Array.isArray(typed.data)).toBe(true);
    expect(typed.data.length).toBeGreaterThanOrEqual(1);
  });
});
