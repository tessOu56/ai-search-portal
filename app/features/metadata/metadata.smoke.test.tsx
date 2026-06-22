import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  buildDetailGenUiDocument,
  GenUiRenderer,
} from "~/components/shared/genui";
import { MetadataSearchPanel } from "~/features/metadata";
import { listMetadataAssets } from "~/services/metadata.server";

vi.mock("@remix-run/react", () => ({
  Link: ({
    to,
    children,
    ...props
  }: {
    to: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  Form: ({
    children,
    ...props
  }: {
    children: React.ReactNode;
    method?: string;
    action?: string;
    className?: string;
  }) => <form {...props}>{children}</form>,
}));

describe("metadata catalog", () => {
  it("listMetadataAssets returns paginated results", () => {
    const result = listMetadataAssets({});
    expect(result.data.length).toBeGreaterThan(0);
    expect(result.pagination.total).toBeGreaterThan(0);
  });

  it("MetadataSearchPanel renders results", () => {
    const result = listMetadataAssets({ q: "customer" });
    render(
      <MetadataSearchPanel
        model={{
          query: "customer",
          activePackId: "enterprise-mau",
          packs: [
            {
              id: "enterprise-mau",
              name: "Enterprise analytics",
              description: "MAU demo pack",
              defaultLocale: "en",
            },
          ],
          results: result.data,
          pagination: result.pagination,
        }}
      />
    );
    expect(
      screen.getByRole("heading", { name: /metadata catalog/i })
    ).toBeTruthy();
    expect(screen.getByText(/customer_profile/i)).toBeTruthy();
  });

  it("GenUiRenderer renders lineage graph node", () => {
    const doc = buildDetailGenUiDocument({
      name: "test",
      fqn: "analytics.public.test",
      owner: "owner@example.com",
      classification: "PII",
      tags: ["PII"],
      columns: [{ name: "email", dataType: "varchar", sensitive: true }],
      maskFields: ["email"],
      lineageNodes: [
        { id: "a", label: "A", type: "table" },
        { id: "b", label: "B", type: "table" },
      ],
      lineageEdges: [{ source: "a", target: "b" }],
    });
    render(<GenUiRenderer document={doc} />);
    expect(screen.getByText(/Lineage/i)).toBeTruthy();
    expect(screen.getByText(/Masked by policy/i)).toBeTruthy();
  });
});
