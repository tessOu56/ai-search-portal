import { describe, expect, it } from "vitest";

import { executeRegisteredTool } from "./dispatch";

const TOOL_SUBMIT = "access_request.submit";
const TOOL_DRAFT = "access_request.draft";
const ASSET_ID = "tbl-customers";

describe("executeRegisteredTool HITL gate (T-2026-068)", () => {
  it("rejects access_request.submit without hitlConfirmed", async () => {
    const result = await executeRegisteredTool(
      TOOL_SUBMIT,
      {
        assetId: ASSET_ID,
        purpose: "analytics",
        role: "analyst",
        approved: true,
      },
      { hitlConfirmed: false },
      {
        [TOOL_SUBMIT]: () => {
          throw new Error("should not run");
        },
      }
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("HITL_REQUIRED");
    expect(result.error.riskLevel).toBe("high");
  });

  it("runs access_request.submit when hitlConfirmed", async () => {
    const result = await executeRegisteredTool(
      TOOL_SUBMIT,
      {
        assetId: ASSET_ID,
        purpose: "analytics",
        role: "analyst",
        approved: true,
      },
      { hitlConfirmed: true },
      {
        [TOOL_SUBMIT]: () => ({
          requestId: "req-1",
          status: "pending_approval",
          decision: {
            allow: false,
            need_approval: true,
            mask_fields: [],
            require_audit: false,
            decision_id: "dec-1",
            reasons: ["mock"],
          },
          auditLogged: true,
        }),
      }
    );
    expect(result.ok).toBe(true);
  });

  it("allows access_request.draft without HITL (medium)", async () => {
    const result = await executeRegisteredTool(
      TOOL_DRAFT,
      {
        assetId: ASSET_ID,
        purpose: "analytics",
        role: "analyst",
      },
      {},
      {
        [TOOL_DRAFT]: () => ({
          decision: {
            allow: false,
            need_approval: true,
            mask_fields: ["email"],
            require_audit: false,
            decision_id: "dec-2",
            reasons: ["needs approval"],
          },
          draft: {
            assetId: ASSET_ID,
            purpose: "analytics",
            role: "analyst",
            asDraft: true,
          },
        }),
      }
    );
    expect(result.ok).toBe(true);
  });
});
