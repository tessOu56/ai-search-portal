import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useActionData, useLoaderData } from "@remix-run/react";

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

export function loader({ params, request }: LoaderFunctionArgs) {
  const assetId = params.assetId;
  if (!assetId) throw new Response("Missing assetId", { status: 400 });

  const packId = parsePackIdFromRequest(request);
  const asset = getMetadataAsset(assetId, packId);
  if (!asset) throw new Response("Asset not found", { status: 404 });

  const url = new URL(request.url);
  const purpose =
    (url.searchParams.get("purpose") as
      "analytics" | "marketing" | "operations" | null) ?? "analytics";
  const role =
    (url.searchParams.get("role") as
      "analyst" | "data_admin" | "engineer" | null) ?? "analyst";

  const lineage = resolveMetadataLineage(assetId, packId);
  const policyDecision = evaluateMetadataAccess({
    assetId,
    purpose,
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
  });

  return json({
    asset,
    genUiDocument,
    policyDecision,
    role,
    purpose,
    packId,
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
  const { asset, genUiDocument, policyDecision, role, purpose } =
    useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <MetadataAssetDetailView
      asset={asset}
      genUiDocument={genUiDocument}
      policyDecision={policyDecision}
      role={role}
      purpose={purpose}
      submitResult={
        actionData
          ? { ok: actionData.ok, message: actionData.message }
          : undefined
      }
    />
  );
}
