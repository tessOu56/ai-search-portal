import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    env: {
      ADMIN_API_TOKEN: "test-admin-token",
      REVIEWER_API_TOKEN: "test-reviewer-token",
      REQUESTER_API_TOKEN: "test-requester-token",
    },
  },
});
