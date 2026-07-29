import {
  agentToolNameSchema,
  toolMetadataSchema,
} from "@ai-search-portal/contracts";
import { describe, expect, it } from "vitest";

import {
  DEFAULT_ALLOWED_TOOLS,
  getToolContract,
  GOVERNED_TOOL_REGISTRY,
  isAllowedTool,
  isGovernedTool,
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

describe("GOVERNED_TOOL_REGISTRY (T-068：HITL 解鎖後進 allowlist)", () => {
  it("registers governed tools with full contracts and includes them in the allowlist", () => {
    for (const name of Object.keys(GOVERNED_TOOL_REGISTRY)) {
      expect(isAllowedTool(name)).toBe(true);
      expect(isGovernedTool(name)).toBe(true);
      const contract =
        GOVERNED_TOOL_REGISTRY[name as keyof typeof GOVERNED_TOOL_REGISTRY];
      expect(contract.input).toBeDefined();
      expect(contract.output).toBeDefined();
      expect(toolMetadataSchema.safeParse(contract.metadata).success).toBe(
        true
      );
    }
  });

  it("submit contract enforces high-risk governance flags", () => {
    const submit = GOVERNED_TOOL_REGISTRY["access_request.submit"];
    expect(submit.metadata.riskLevel).toBe("high");
    expect(submit.metadata.requiresHitl).toBe(true);
    expect(submit.metadata.forceAudit).toBe(true);
  });
});
