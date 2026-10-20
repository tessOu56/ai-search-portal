import type { LoaderFunctionArgs } from "react-router";
import { describe, expect, it } from "vitest";

import { loader as listLoader } from "~/routes/api.metadata";
import { loader as assetLoader } from "~/routes/api.metadata.$assetId";
import { loader as lineageLoader } from "~/routes/api.metadata.$assetId.lineage";
import {
  getMetadataAssetResponseSchema,
  listMetadataResponseSchema,
  metadataLineageResponseSchema,
} from "~/shared/contracts";

const CUSTOMERS = "tbl-customers";

function asLoader(
  url: string,
  params: Record<string, string> = {}
): LoaderFunctionArgs {
  return {
    request: new Request(url),
    params,
    context: {},
  } as unknown as LoaderFunctionArgs;
}

async function asResponse(
  value: Response | Promise<Response>
): Promise<Response> {
  return Promise.resolve(value);
}

describe("GET /api/metadata", () => {
  it("lists assets in contract shape and honors type filters", async () => {
    const listed = listMetadataResponseSchema.parse(
      await (
        await asResponse(
          listLoader(asLoader("http://localhost/api/metadata?q=customer"))
        )
      ).json()
    );
    expect(listed.data.some((row) => row.id === CUSTOMERS)).toBe(true);

    const tables = listMetadataResponseSchema.parse(
      await (
        await asResponse(
          listLoader(asLoader("http://localhost/api/metadata?type=Table"))
        )
      ).json()
    );
    expect(tables.data.every((row) => row.assetType === "Table")).toBe(true);
  });
});

describe("GET /api/metadata/:assetId", () => {
  it("returns the customer_profile asset", async () => {
    const response = await asResponse(
      assetLoader(
        asLoader(`http://localhost/api/metadata/${CUSTOMERS}`, {
          assetId: CUSTOMERS,
        })
      )
    );
    expect(response.status).toBe(200);
    const body = getMetadataAssetResponseSchema.parse(await response.json());
    expect(body.data.classification).toBe("PII");
  });

  it("returns 404 for an unknown asset", async () => {
    const response = await asResponse(
      assetLoader(
        asLoader("http://localhost/api/metadata/missing", {
          assetId: "missing",
        })
      )
    );
    expect(response.status).toBe(404);
  });

  it("returns 400 when assetId is missing", async () => {
    const response = await asResponse(
      assetLoader(asLoader("http://localhost/api/metadata/", {}))
    );
    expect(response.status).toBe(400);
  });
});

describe("GET /api/metadata/:assetId/lineage", () => {
  it("returns upstream/downstream for customer_profile", async () => {
    const response = await asResponse(
      lineageLoader(
        asLoader(`http://localhost/api/metadata/${CUSTOMERS}/lineage`, {
          assetId: CUSTOMERS,
        })
      )
    );
    expect(response.status).toBe(200);
    const body = metadataLineageResponseSchema.parse(await response.json());
    expect(body.data.assetId).toBe(CUSTOMERS);
    expect(body.data.upstream.some((row) => row.id === "db-analytics")).toBe(
      true
    );
    expect(body.data.downstream.length).toBeGreaterThan(0);
  });

  it("returns 404 for a missing asset", async () => {
    const response = await asResponse(
      lineageLoader(
        asLoader("http://localhost/api/metadata/missing/lineage", {
          assetId: "missing",
        })
      )
    );
    expect(response.status).toBe(404);
  });
});
