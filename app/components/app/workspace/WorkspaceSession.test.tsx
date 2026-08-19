import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LAST_OVERVIEW_STORAGE_KEY } from "~/lib/workspace-mode";

import {
  useWorkspaceSession,
  WorkspaceSessionProvider,
} from "./WorkspaceSession";

const CATALOG_PATH = "/catalog-search";
const RETURN_TEST_ID = "overview-return";
const nav = vi.hoisted(() => ({ pathname: "/", search: "" }));

vi.mock("@remix-run/react", () => ({
  useLocation: () => ({ pathname: nav.pathname, search: nav.search }),
  useSearchParams: () => [
    new URLSearchParams(
      nav.search.startsWith("?") ? nav.search.slice(1) : nav.search
    ),
    vi.fn(),
  ],
}));

function ReturnProbe() {
  const { overviewReturnHref } = useWorkspaceSession();
  return <span data-testid={RETURN_TEST_ID}>{overviewReturnHref}</span>;
}

function sessionTree() {
  return (
    <WorkspaceSessionProvider>
      <ReturnProbe />
    </WorkspaceSessionProvider>
  );
}

afterEach(() => {
  nav.pathname = "/";
  nav.search = "";
  sessionStorage.removeItem(LAST_OVERVIEW_STORAGE_KEY);
});

describe("WorkspaceSessionProvider", () => {
  it("keeps the Overview page after Ask and a follow-up question", () => {
    nav.pathname = CATALOG_PATH;
    nav.search = "";
    const { rerender } = render(sessionTree());
    expect(screen.getByTestId(RETURN_TEST_ID)).toHaveTextContent(CATALOG_PATH);

    nav.pathname = "/";
    nav.search = "";
    rerender(sessionTree());
    expect(screen.getByTestId(RETURN_TEST_ID)).toHaveTextContent(CATALOG_PATH);

    nav.search = "?q=Which%20datasets%20contain%20PII";
    rerender(sessionTree());
    expect(screen.getByTestId(RETURN_TEST_ID)).toHaveTextContent(CATALOG_PATH);
  });
});
