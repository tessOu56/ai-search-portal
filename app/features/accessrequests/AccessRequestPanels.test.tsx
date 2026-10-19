import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { AccessRequestReviewPanel } from "./AccessRequestPanels";

vi.mock("react-router", () => ({
  Link: ({ to, children, ...props }: { to: string; children: ReactNode }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  Form: ({ children, ...props }: { children: ReactNode }) => (
    <form {...props}>{children}</form>
  ),
  useNavigation: () => ({ state: "submitting", location: undefined }),
  useFetcher: () => ({
    state: "idle",
    data: undefined,
    Form: ({ children, ...props }: { children: ReactNode }) => (
      <form {...props}>{children}</form>
    ),
  }),
}));

vi.mock("~/shared/i18n/context", () => ({
  useI18n: () => ({
    t: (key: string) => {
      const labels = new Map([
        ["nav.access-review", "Access review"],
        ["access-review.lead", "Owner queue"],
        ["access-review.empty.title", "No pending approvals"],
        ["access-review.empty.desc", "New requests will show up here."],
        ["access-review.empty.action", "Browse data assets"],
        ["access-review.empty.track", "Track my requests"],
        ["session.demoCallout", "Demo persona"],
        ["session.demoLabel", "Demo session:"],
        ["session.roleAria", "Demo session role"],
        ["applications.loading", "Loading applications"],
      ]);
      return labels.get(key) ?? key;
    },
  }),
}));

describe("AccessRequestReviewPanel", () => {
  it("empty state offers catalog and requester next steps", () => {
    render(<AccessRequestReviewPanel pending={[]} sessionRole="owner" />);
    expect(screen.getByTestId("access-review-empty-state")).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Browse data assets" })
    ).toHaveAttribute("href", "/metadata");
    expect(
      screen.getByRole("link", { name: "Track my requests" })
    ).toHaveAttribute("href", "/my-apis?sessionRole=requester");
    expect(screen.queryByLabelText("Loading applications")).toBeNull();
  });
});
