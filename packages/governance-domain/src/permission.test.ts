import { describe, expect, it } from "vitest";

import { permissionFor } from "./permission.js";

describe("permissionFor", () => {
  it("maps lifecycle status to permission status", () => {
    expect(permissionFor("approved")).toBe("granted");
    expect(permissionFor("pending_approval")).toBe("pending");
    expect(permissionFor("draft")).toBe("pending");
    expect(permissionFor("denied")).toBe("revoked");
    expect(permissionFor("expired")).toBe("revoked");
    expect(permissionFor("cancelled")).toBe("revoked");
  });
});
