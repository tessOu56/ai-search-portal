import type { MetaFunction } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";

import { listDeveloperApis } from "~/features/developers/developer-apis.server";

export const meta: MetaFunction = () => [
  { title: "Developer Hub · Portal" },
  {
    name: "description",
    content:
      "Read-only API explorer for the Portal demo. Try-it calls sandbox fixtures only.",
  },
];

export function loader() {
  return { apis: listDeveloperApis() };
}

export default function DevelopersIndexRoute() {
  const { apis } = useLoaderData<typeof loader>();

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <header className="space-y-2">
        <p className="text-sm text-muted-foreground">Developer Hub · sandbox</p>
        <h1 className="text-2xl font-semibold">APIs</h1>
        <p className="text-sm text-muted-foreground">
          Read-only catalog. Try-it returns labelled mock responses — no
          production writes or real keys.
        </p>
      </header>
      <ul className="divide-y rounded-md border">
        {apis.map((api) => (
          <li key={api.id} className="p-4">
            <Link
              to={`/developers/apis/${api.id}`}
              className="font-medium text-primary hover:underline"
            >
              {api.name}
            </Link>
            <p className="mt-1 text-sm text-muted-foreground">
              {api.description}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {api.basePath} · v{api.version}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
