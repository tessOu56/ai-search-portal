import { auditEventSchema } from "@ai-search-portal/contracts";
import { afterEach, describe, expect, it } from "vitest";

import {
  appendAuditEvent,
  listAuditEvents,
  resetAuditLogForTest,
} from "./audit-log.server";

const validInput = {
  action: "access_request.submit",
  actor: { role: "analyst" as const },
  resource: { type: "metadata_asset", id: "asset-1" },
  decisionId: "dec-1",
  requestId: "req-1",
  outcome: "pending_approval" as const,
  requireAudit: true,
  reasons: ["policy: confidential classification requires audit log"],
};

describe("audit-log.server", () => {
  afterEach(() => {
    resetAuditLogForTest();
  });

  it("appends a contract-valid event with generated id/at", () => {
    const event = appendAuditEvent(validInput);
    expect(event).not.toBeNull();
    expect(auditEventSchema.safeParse(event).success).toBe(true);
    expect(event?.id).toBeTruthy();
    expect(event?.at).toBeTruthy();
  });

  it("returns null instead of throwing on contract-invalid input", () => {
    const event = appendAuditEvent({
      ...validInput,
      // @ts-expect-error 驗證 runtime 防禦：非法 outcome
      outcome: "exploded",
    });
    expect(event).toBeNull();
    expect(listAuditEvents().total).toBe(0);
  });

  it("lists newest-first with bounded limit", () => {
    appendAuditEvent({ ...validInput, decisionId: "dec-1" });
    appendAuditEvent({ ...validInput, decisionId: "dec-2" });
    const { data, total } = listAuditEvents(1);
    expect(total).toBe(2);
    expect(data).toHaveLength(1);
    expect(data[0]?.decisionId).toBe("dec-2");
  });
});
