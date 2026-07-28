import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { MyApisPanel } from "~/features/accessrequests";
import { listAccessApplications } from "~/services/access-request-store.server";
import {
  type GovernanceSessionRole,
  governanceSessionRoleSchema,
} from "~/shared/contracts";

export const meta: MetaFunction = () => [
  { title: "My APIs · AI Search Portal" },
  {
    name: "description",
    content: "Track metadata access applications and permission status.",
  },
];

function resolveSessionRole(raw: string | null): GovernanceSessionRole {
  const parsed = governanceSessionRoleSchema.safeParse(raw);
  return parsed.success ? parsed.data : "requester";
}

export function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const sessionRole = resolveSessionRole(url.searchParams.get("sessionRole"));
  const applications =
    sessionRole === "requester" ? listAccessApplications() : [];
  return json({ sessionRole, applications });
}

export default function MyApisRoute() {
  const { sessionRole, applications } = useLoaderData<typeof loader>();
  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <MyApisPanel applications={applications} sessionRole={sessionRole} />
    </main>
  );
}
