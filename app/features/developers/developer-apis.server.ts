/**
 * Developer Hub API catalog (read-only fixture). No prod writes.
 */

export type DeveloperApiSummary = {
  id: string;
  name: string;
  description: string;
  version: string;
  basePath: string;
  sandboxOnly: true;
};

export type DeveloperApiOperation = {
  id: string;
  method: "GET" | "POST";
  path: string;
  summary: string;
  sandboxResponse: Record<string, unknown>;
};

export type DeveloperApiDetail = DeveloperApiSummary & {
  operations: DeveloperApiOperation[];
};

const CATALOG: DeveloperApiDetail[] = [
  {
    id: "metadata",
    name: "Metadata API",
    description:
      "Read-only catalog of data assets, lineage, and access-request workflow (mock BFF).",
    version: "0.1.0",
    basePath: "/api/metadata",
    sandboxOnly: true,
    operations: [
      {
        id: "list-metadata",
        method: "GET",
        path: "/api/metadata",
        summary: "List assets visible in the demo pack",
        sandboxResponse: {
          items: [{ id: "tbl-customers", name: "Customers", type: "table" }],
          total: 1,
          _sandbox: true,
        },
      },
      {
        id: "get-asset",
        method: "GET",
        path: "/api/metadata/{assetId}",
        summary: "Asset detail with owner and classification",
        sandboxResponse: {
          id: "tbl-customers",
          owner: "data-platform",
          classification: "internal",
          _sandbox: true,
        },
      },
    ],
  },
  {
    id: "items",
    name: "Items API",
    description: "Demo items lookup used by Agent tools (read-only).",
    version: "0.1.0",
    basePath: "/api/items",
    sandboxOnly: true,
    operations: [
      {
        id: "list-items",
        method: "GET",
        path: "/api/items",
        summary: "Paginated items for the active context pack",
        sandboxResponse: {
          items: [{ id: "item_1", label: "Sample item" }],
          _sandbox: true,
        },
      },
    ],
  },
];

export function listDeveloperApis(): DeveloperApiSummary[] {
  return CATALOG.map(({ operations: _ops, ...summary }) => summary);
}

export function getDeveloperApi(apiId: string): DeveloperApiDetail | null {
  return CATALOG.find((api) => api.id === apiId) ?? null;
}
