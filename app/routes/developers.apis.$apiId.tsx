import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, Link, useActionData, useLoaderData } from "@remix-run/react";
import { useState } from "react";

import {
  getDeveloperApi,
  listDeveloperApis,
} from "~/features/developers/developer-apis.server";

export const meta: MetaFunction<typeof loader> = ({ data }) => [
  { title: data?.api ? `${data.api.name} · Developer Hub` : "Developer Hub" },
  {
    name: "description",
    content: data?.api?.description ?? "API explorer (sandbox)",
  },
];

export function loader({ params }: LoaderFunctionArgs) {
  const apiId = params.apiId ?? "";
  const api = getDeveloperApi(apiId);
  if (!api) {
    throw new Response("Not Found", { status: 404 });
  }
  return {
    api,
    allApis: listDeveloperApis(),
  };
}

export async function action({ request, params }: ActionFunctionArgs) {
  const apiId = params.apiId ?? "";
  const api = getDeveloperApi(apiId);
  if (!api) {
    return json({ error: "API not found" }, { status: 404 });
  }
  const form = await request.formData();
  const operationId = String(form.get("operationId") ?? "");
  const operation = api.operations.find((op) => op.id === operationId);
  if (!operation) {
    return json({ error: "Unknown operation" }, { status: 400 });
  }
  return json({
    sandbox: true,
    method: operation.method,
    path: operation.path,
    body: operation.sandboxResponse,
  });
}

export default function DeveloperApiDetailRoute() {
  const { api, allApis } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [selectedOpId, setSelectedOpId] = useState(api.operations[0]?.id ?? "");

  return (
    <div className="grid min-h-[70vh] grid-cols-1 gap-0 lg:grid-cols-[220px_1fr_320px]">
      <aside className="border-b p-4 lg:border-b-0 lg:border-r">
        <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
          APIs
        </p>
        <ul className="space-y-2 text-sm">
          {allApis.map((item) => (
            <li key={item.id}>
              <Link
                to={`/developers/apis/${item.id}`}
                className={
                  item.id === api.id
                    ? "font-semibold text-primary"
                    : "hover:underline"
                }
              >
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </aside>

      <section className="border-b p-4 lg:border-b-0 lg:border-r">
        <h1 className="text-xl font-semibold">{api.name}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{api.description}</p>
        <p className="mt-4 text-xs text-muted-foreground">
          Base {api.basePath} · sandbox only
        </p>
        <ul className="mt-6 space-y-3">
          {api.operations.map((op) => (
            <li key={op.id}>
              <button
                type="button"
                onClick={() => setSelectedOpId(op.id)}
                className={`w-full rounded-md border p-3 text-left text-sm ${
                  selectedOpId === op.id ? "bg-muted/40 border-primary" : ""
                }`}
              >
                <span className="font-mono text-xs">{op.method}</span>{" "}
                <span className="font-mono">{op.path}</span>
                <p className="mt-1 text-muted-foreground">{op.summary}</p>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <aside className="p-4">
        <p className="text-xs font-medium uppercase text-muted-foreground">
          Try it (mock)
        </p>
        {selectedOpId ? (
          <Form method="post" className="mt-3 space-y-3">
            <input type="hidden" name="operationId" value={selectedOpId} />
            <button
              type="submit"
              className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground"
            >
              Send sandbox request
            </button>
          </Form>
        ) : null}
        {actionData && "body" in actionData ? (
          <pre className="mt-4 max-h-80 overflow-auto rounded-md bg-muted p-3 text-xs">
            {JSON.stringify(actionData, null, 2)}
          </pre>
        ) : null}
        {actionData && "error" in actionData ? (
          <p className="mt-4 text-sm text-destructive">{actionData.error}</p>
        ) : null}
      </aside>
    </div>
  );
}
