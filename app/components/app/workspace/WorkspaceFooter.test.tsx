import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { WorkspaceFooter } from "./WorkspaceFooter";

const location = vi.hoisted(() => ({
  pathname: "/catalog-search",
  search: "?q=pii",
}));

vi.mock("react-router", () => ({
  Link: ({ to, children, ...props }: { to: string; children: ReactNode }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  Form: ({ children }: { children: ReactNode }) => <form>{children}</form>,
  useRouteLoaderData: () => ({ locale: "en", version: "1.0.0" }),
  useLocation: () => location,
}));

vi.mock("~/components/theme/ThemeSwitcher", () => ({
  ThemeSwitcher: () => <div>Theme</div>,
}));

vi.mock("~/components/ui/Select", () => ({
  Select: ({
    name,
    defaultValue,
    options,
    "aria-label": ariaLabel,
  }: {
    name?: string;
    defaultValue?: string;
    options: Array<{ value: string; label: string }>;
    "aria-label"?: string;
  }) => (
    <select name={name} defaultValue={defaultValue} aria-label={ariaLabel}>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  ),
}));

vi.mock("~/shared/i18n/context", () => ({
  useI18n: () => ({
    t: (key: string, vars?: Record<string, string>) => {
      const labels = new Map<string, string>([
        ["footer.copyright", `© ${vars?.year ?? "2026"} Portal`],
        ["footer.version", `v${vars?.version ?? "1.0.0"}`],
        ["footer.vitals", "Web Vitals"],
        ["footer.synthetic", "Demo data"],
        ["footer.synthetic.hint", "Synthetic catalog."],
        ["footer.demo_roles", "Demo roles"],
        ["footer.demo_roles.hint", "Not auth."],
        ["release-notes.footer.link", "Release notes"],
        ["locale.switch", "Language"],
        ["locale.zh-TW", "繁體中文"],
        ["locale.en", "English"],
        ["theme.switch", "Theme"],
        ["theme.toLight", "Switch to light"],
        ["theme.toDark", "Switch to dark"],
      ]);
      return labels.get(key) ?? key;
    },
  }),
}));

describe("WorkspaceFooter", () => {
  it("keeps language switch on the current overview page", () => {
    render(<WorkspaceFooter />);
    const next = document.querySelector(
      'input[name="next"]'
    ) as HTMLInputElement | null;
    expect(next?.value).toBe("/catalog-search?q=pii");
    expect(screen.getByLabelText("Language")).toBeTruthy();
  });
});
