import {
  analyticsEventSchema,
  citationClickedEventSchema,
  searchSubmittedEventSchema,
} from "@ai-search-portal/contracts";
import { describe, expect, it } from "vitest";

describe("analytics product events", () => {
  it("accepts search_submitted without query text", () => {
    const parsed = searchSubmittedEventSchema.parse({
      name: "search_submitted",
      eventId: "evt-1",
      at: "2026-10-20T18:00:00.000Z",
      surface: "chat",
      properties: { queryLength: 24 },
    });
    expect(parsed.properties.queryLength).toBe(24);
  });

  it("rejects free-form citation properties", () => {
    const result = citationClickedEventSchema.safeParse({
      name: "citation_clicked",
      eventId: "evt-2",
      at: "2026-10-20T18:00:00.000Z",
      surface: "chat",
      properties: { kind: "internal", index: 0, url: "https://example.test" },
    });
    expect(result.success).toBe(false);
  });

  it("discriminates the closed event union", () => {
    const parsed = analyticsEventSchema.parse({
      name: "answer_rendered",
      eventId: "evt-3",
      at: "2026-10-20T18:00:00.000Z",
      surface: "chat",
      properties: { hasSummary: true, sourceCount: 2, durationMs: 410 },
    });
    expect(parsed.name).toBe("answer_rendered");
  });
});
