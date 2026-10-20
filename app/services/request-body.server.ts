/** Bounded JSON body reader — reject oversized payloads before parse. */

export const DEFAULT_MAX_JSON_BYTES = 64 * 1024;

export type JsonBodyResult =
  | { ok: true; value: unknown }
  | {
      ok: false;
      status: 400 | 413;
      error: string;
      code: "PAYLOAD_TOO_LARGE" | "INVALID_JSON";
    };

export async function readJsonBody(
  request: Request,
  maxBytes = DEFAULT_MAX_JSON_BYTES
): Promise<JsonBodyResult> {
  const contentLengthHeader = request.headers.get("content-length");
  if (contentLengthHeader) {
    const contentLength = Number.parseInt(contentLengthHeader, 10);
    if (Number.isFinite(contentLength) && contentLength > maxBytes) {
      return {
        ok: false,
        status: 413,
        error: "Payload too large",
        code: "PAYLOAD_TOO_LARGE",
      };
    }
  }

  let buffer: ArrayBuffer;
  try {
    buffer = await request.arrayBuffer();
  } catch {
    return {
      ok: false,
      status: 400,
      error: "Invalid JSON payload",
      code: "INVALID_JSON",
    };
  }

  if (buffer.byteLength > maxBytes) {
    return {
      ok: false,
      status: 413,
      error: "Payload too large",
      code: "PAYLOAD_TOO_LARGE",
    };
  }

  if (buffer.byteLength === 0) {
    return { ok: true, value: {} };
  }

  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
    return { ok: true, value: JSON.parse(text) as unknown };
  } catch {
    return {
      ok: false,
      status: 400,
      error: "Invalid JSON payload",
      code: "INVALID_JSON",
    };
  }
}

export function jsonBodyErrorResponse(
  result: Extract<JsonBodyResult, { ok: false }>
): Response {
  return Response.json(
    { error: result.error, code: result.code },
    { status: result.status }
  );
}
