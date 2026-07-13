import {
  agentToolNameSchema,
  toolMetadataSchema,
} from "@ai-search-portal/contracts";
import { describe, expect, it } from "vitest";

import {
  DEFAULT_ALLOWED_TOOLS,
  getToolContract,
  isAllowedTool,
  listToolMetadata,
  TOOL_REGISTRY,
} from "./registry";

describe("TOOL_REGISTRY (agentic 階段二)", () => {
  it("keeps DEFAULT_ALLOWED_TOOLS in sync with agentToolNameSchema (契約交叉驗證)", () => {
    expect([...DEFAULT_ALLOWED_TOOLS].sort()).toEqual(
      [...agentToolNameSchema.options].sort()
    );
  });

  it("registers a contract with metadata + input/output schema for every allowed tool", () => {
    for (const name of DEFAULT_ALLOWED_TOOLS) {
      const contract = getToolContract(name);
      expect(contract.metadata.name).toBe(name);
      expect(toolMetadataSchema.safeParse(contract.metadata).success).toBe(
        true
      );
      expect(contract.input).toBeDefined();
      expect(contract.output).toBeDefined();
    }
  });

  it("enforces governance invariant: high risk ⇒ requiresHitl", () => {
    const invalid = toolMetadataSchema.safeParse({
      name: "danger.tool",
      description: "high risk without HITL must fail",
      riskLevel: "high",
      requiresHitl: false,
      forceAudit: true,
      timeoutMs: 1000,
    });
    expect(invalid.success).toBe(false);
  });

  it("keeps existing allowlist behavior unchanged", () => {
    expect(isAllowedTool("items.lookup")).toBe(true);
    expect(isAllowedTool("not.a.tool")).toBe(false);
    expect(Object.keys(TOOL_REGISTRY)).toHaveLength(
      DEFAULT_ALLOWED_TOOLS.length
    );
  });

  it("lists serializable metadata for discover 用途", () => {
    const metas = listToolMetadata();
    expect(metas).toHaveLength(DEFAULT_ALLOWED_TOOLS.length);
    for (const meta of metas) {
      expect(() => JSON.stringify(meta)).not.toThrow();
    }
  });
});
