import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useActionData, useLoaderData } from "@remix-run/react";
import { z } from "zod";

import { buildDetailGenUiDocument } from "~/components/shared/genui";
import { MetadataAssetDetailView } from "~/features/metadata";
import {
  evaluateMetadataAccess,
  submitMetadataAccessRequest,
} from "~/services/access-policy.server";
import { parsePackIdFromRequest } from "~/services/context-pack.server";
import {
  getMetadataAsset,
  resolveMetadataLineage,
} from "~/services/metadata.server";
import {
  genUiDocumentSchema,
  metadataAccessRequestSchema,
} from "~/shared/contracts";

const aiAccessRequestPayloadSchema = z.object({
  request: metadataAccessRequestSchema,
  genUiDocument: genUiDocumentSchema,
  rationale: z.string().min(1),
});

function buildAiAccessRequestPayload(args: {
  mode: string | null;
  assetId: string;
  asset: NonNullable<ReturnType<typeof getMetadataAsset>>;
  purpose: "analytics" | "marketing" | "operations";
  role: "analyst" | "data_admin" | "engineer";
}) {
  if (args.mode === null) return { status: "idle" as const };

  const rawPayload =
    args.mode === "invalid"
      ? {
          request: {
            assetId: "",
            purpose: "sales-demo",
            role: args.role,
          },
          genUiDocument: {
            version: "draft",
            nodes: [],
          },
          rationale: "",
        }
      : {
          request: {
            assetId: args.assetId,
            purpose: args.purpose,
            role: args.role,
            approved: false,
          },
          genUiDocument: {
            version: "1",
            nodes: [
              {
                type: "metadata-summary-card",
                props: {
                  name: args.asset.name,
                  fqn: args.asset.fqn,
                  owner: args.asset.owner,
                  classification: args.asset.classification,
                  tags: args.asset.tags,
                },
              },
            ],
          },
          rationale: `AI drafted an access request for ${args.asset.name}.`,
        };

  const parsed = aiAccessRequestPayloadSchema.safeParse(rawPayload);
  if (!parsed.success) {
    return {
      status: "invalid" as const,
      query: `Access request for ${args.asset.name}`,
      reason: "AI-generated access request failed validation.",
    };
  }

  return {
    status: "valid" as const,
    ...parsed.data,
  };
}

export function loader({ params, request }: LoaderFunctionArgs) {
  const assetId = params.assetId;
  if (!assetId) throw new Response("Missing assetId", { status: 400 });

  const packId = parsePackIdFromRequest(request);
  const asset = getMetadataAsset(assetId, packId);
  if (!asset) throw new Response("Asset not found", { status: 404 });

  const url = new URL(request.url);
  const aiFillMode = url.searchParams.get("aiFill");
  const purpose =
    (url.searchParams.get("purpose") as
      "analytics" | "marketing" | "operations" | null) ?? "analytics";
  const role =
    (url.searchParams.get("role") as
      "analyst" | "data_admin" | "engineer" | null) ?? "analyst";
  const effectivePurpose =
    aiFillMode === "1" && !url.searchParams.has("purpose")
      ? ("marketing" as const)
      : purpose;

  const lineage = resolveMetadataLineage(assetId, packId);
  const policyDecision = evaluateMetadataAccess({
    assetId,
    purpose: effectivePurpose,
    role,
    packId,
  });

  const genUiDocument = buildDetailGenUiDocument({
    name: asset.name,
    fqn: asset.fqn,
    owner: asset.owner,
    classification: asset.classification,
    tags: asset.tags,
    columns: asset.columns ?? [],
    maskFields: policyDecision.mask_fields,
    lineageNodes: lineage?.nodes ?? [],
    lineageEdges: lineage?.edges ?? [],
    lineageDependencyOrder: lineage?.dependencyOrder ?? [],
    lineageCycleError: lineage?.cycleError ?? null,
  });
  const aiAccessRequest = buildAiAccessRequestPayload({
    mode: aiFillMode,
    assetId,
    asset,
    purpose: effectivePurpose,
    role,
  });

  return json({
    asset,
    genUiDocument,
    policyDecision,
    role,
    purpose: effectivePurpose,
    packId,
    aiAccessRequest,
  });
}

export async function action({ params, request }: ActionFunctionArgs) {
  const assetId = params.assetId;
  if (!assetId) {
    return json({ ok: false, message: "Missing assetId" }, { status: 400 });
  }

  const form = await request.formData();
  if (form.get("intent") !== "access-request") {
    return json({ ok: false, message: "Unknown intent" }, { status: 400 });
  }

  const purpose = form.get("purpose");
  const role = form.get("role");
  const approved = form.get("approved") === "true";

  if (
    purpose !== "analytics" &&
    purpose !== "marketing" &&
    purpose !== "operations"
  ) {
    return json({ ok: false, message: "Invalid purpose" }, { status: 400 });
  }

  const packId = parsePackIdFromRequest(request);

  const result = submitMetadataAccessRequest({
    assetId,
    purpose,
    role:
      role === "data_admin" || role === "engineer" || role === "analyst"
        ? role
        : "analyst",
    approved,
    packId,
  });

  if (!result.ok) {
    return json(
      { ok: false, message: result.error },
      { status: result.status }
    );
  }

  return json({
    ok: true,
    message: `Request ${result.data.status} (audit: ${result.data.auditLogged})`,
  });
}

export default function MetadataAssetPage() {
  const {
    asset,
    genUiDocument,
    policyDecision,
    role,
    purpose,
    aiAccessRequest,
  } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <MetadataAssetDetailView
      asset={asset}
      genUiDocument={genUiDocument}
      policyDecision={policyDecision}
      role={role}
      purpose={purpose}
      aiAccessRequest={aiAccessRequest}
      submitResult={
        actionData
          ? { ok: actionData.ok, message: actionData.message }
          : undefined
      }
    />
  );
}
