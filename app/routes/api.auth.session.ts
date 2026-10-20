import { sessionResponseSchema } from "@ai-search-portal/contracts";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";

import {
  authenticateRequest,
  authFailureResponse,
  sessionClearCookie,
  sessionCookieValue,
  sessionSetCookie,
} from "~/services/auth.server";
import { rejectIfRateLimited } from "~/services/route-guard.server";

export function loader({ request }: LoaderFunctionArgs) {
  const limited = rejectIfRateLimited(request, "auth");
  if (limited) return limited;
  const auth = authenticateRequest(request);
  if (!auth.ok) return authFailureResponse(auth);
  return Response.json(sessionResponseSchema.parse({ data: auth.user }));
}

export function action({ request }: ActionFunctionArgs) {
  const limited = rejectIfRateLimited(request, "auth");
  if (limited) return limited;

  if (request.method === "DELETE") {
    return new Response(null, {
      status: 204,
      headers: { "Set-Cookie": sessionClearCookie() },
    });
  }

  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const auth = authenticateRequest(request);
  if (!auth.ok) return authFailureResponse(auth);
  const cookie = sessionCookieValue(auth.user);
  if (!cookie) {
    return authFailureResponse({
      ok: false,
      status: 503,
      error: "Admin API token is not configured",
      code: "AUTH_NOT_CONFIGURED",
    });
  }

  return Response.json(sessionResponseSchema.parse({ data: auth.user }), {
    headers: { "Set-Cookie": sessionSetCookie(cookie) },
  });
}
