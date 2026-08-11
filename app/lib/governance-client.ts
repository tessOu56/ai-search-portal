/**
 * Client fetch helpers for governance mutations — AbortSignal + X-Request-Id (T-186).
 */

export type GovernanceFetchInit = {
  method?: "GET" | "POST";
  body?: unknown;
  signal?: AbortSignal;
  requestId?: string;
  idempotencyKey?: string;
};

function newRequestId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `req-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export async function governanceFetch(
  path: string,
  init: GovernanceFetchInit = {}
): Promise<Response> {
  const headers = new Headers({
    Accept: "application/json",
    "X-Request-Id": init.requestId ?? newRequestId(),
  });
  if (init.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }
  if (init.idempotencyKey) {
    headers.set("Idempotency-Key", init.idempotencyKey);
  }
  return fetch(path, {
    method: init.method ?? (init.body !== undefined ? "POST" : "GET"),
    headers,
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    signal: init.signal,
  });
}

export function evaluateAccess(
  body: { assetId: string; purpose: string; role?: string },
  init?: Omit<GovernanceFetchInit, "body" | "method">
) {
  return governanceFetch("/api/metadata/access-requests/evaluate", {
    ...init,
    method: "POST",
    body,
  });
}

export function submitAccess(
  body: Record<string, unknown>,
  init?: Omit<GovernanceFetchInit, "body" | "method">
) {
  return governanceFetch("/api/metadata/access-requests", {
    ...init,
    method: "POST",
    body,
  });
}

export function reviewAccess(
  requestId: string,
  body: {
    decision: "approved" | "denied" | "edited";
    purpose?: string;
    role?: string;
  },
  init?: Omit<GovernanceFetchInit, "body" | "method">
) {
  return governanceFetch(
    `/api/metadata/access-requests/${encodeURIComponent(requestId)}/review`,
    { ...init, method: "POST", body }
  );
}

export function submitDraftAccess(
  requestId: string,
  body: { approved?: boolean } = {},
  init?: Omit<GovernanceFetchInit, "body" | "method">
) {
  return governanceFetch(
    `/api/metadata/access-requests/${encodeURIComponent(requestId)}/submit`,
    { ...init, method: "POST", body }
  );
}

export function cancelAccess(
  requestId: string,
  body: { reason?: string } = {},
  init?: Omit<GovernanceFetchInit, "body" | "method">
) {
  return governanceFetch(
    `/api/metadata/access-requests/${encodeURIComponent(requestId)}/cancel`,
    { ...init, method: "POST", body }
  );
}
