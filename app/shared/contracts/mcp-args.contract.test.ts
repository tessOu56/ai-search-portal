import type { McpToolName } from "@ai-search-portal/contracts";
import {
  AGENT_GOVERNED_TOOL_METADATA,
  MCP_TOOL_METADATA,
  parseMcpToolArguments,
} from "@ai-search-portal/contracts";
import { describe, expect, it } from "vitest";

const MCP_TOOLS = {
  search: "metadata.search",
  get: "metadata.get",
  lineage: "metadata.lineage",
  policy: "policy.evaluate",
} satisfies Record<string, McpToolName>;

const ASSET_A1 = "a-1";

describe("parseMcpToolArguments (階段二收尾：取代 z.record + as 斷言)", () => {
  it("accepts valid metadata.search args (all optional)", () => {
    expect(parseMcpToolArguments(MCP_TOOLS.search, {}).ok).toBe(true);
    expect(
      parseMcpToolArguments(MCP_TOOLS.search, { q: "user", page: 2 }).ok
    ).toBe(true);
  });

  it("rejects wrong-typed metadata.search args (原 as 斷言會靜默放行)", () => {
    const r = parseMcpToolArguments(MCP_TOOLS.search, { page: "two" });
    expect(r.ok).toBe(false);
  });

  it("requires assetId for metadata.get / metadata.lineage", () => {
    expect(parseMcpToolArguments(MCP_TOOLS.get, {}).ok).toBe(false);
    expect(parseMcpToolArguments(MCP_TOOLS.lineage, {}).ok).toBe(false);
    expect(parseMcpToolArguments(MCP_TOOLS.get, { assetId: ASSET_A1 }).ok).toBe(
      true
    );
  });

  it("requires assetId + valid purpose for policy.evaluate", () => {
    expect(
      parseMcpToolArguments(MCP_TOOLS.policy, { assetId: ASSET_A1 }).ok
    ).toBe(false);
    expect(
      parseMcpToolArguments(MCP_TOOLS.policy, {
        assetId: ASSET_A1,
        purpose: "analytics",
      }).ok
    ).toBe(true);
    expect(
      parseMcpToolArguments(MCP_TOOLS.policy, {
        assetId: ASSET_A1,
        purpose: "crypto-mining",
      }).ok
    ).toBe(false);
  });

  it("returns stable error message without leaking internals", () => {
    const r = parseMcpToolArguments(MCP_TOOLS.get, {});
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/^Invalid arguments: /);
  });
});

describe("風險註記 metadata", () => {
  it("all MCP tools are read-only low risk without HITL", () => {
    for (const meta of Object.values(MCP_TOOL_METADATA)) {
      expect(meta.riskLevel).toBe("low");
      expect(meta.requiresHitl).toBe(false);
    }
  });

  it("governed submit is high risk with HITL + forced audit (不變式活體驗證)", () => {
    const submit = AGENT_GOVERNED_TOOL_METADATA["access_request.submit"];
    expect(submit.riskLevel).toBe("high");
    expect(submit.requiresHitl).toBe(true);
    expect(submit.forceAudit).toBe(true);
    const draft = AGENT_GOVERNED_TOOL_METADATA["access_request.draft"];
    expect(draft.riskLevel).toBe("medium");
  });
});
