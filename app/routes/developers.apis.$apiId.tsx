import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, Link, useActionData, useLoaderData } from "@remix-run/react";
import { useState } from "react";

import {
  ProductPageHeader,
  ProductPageShell,
} from "~/components/shared/product/ProductPageShell";
import { Button } from "~/components/ui/Button";
import { Stack } from "~/components/ui/Stack";
import { StatusChip } from "~/components/ui/StatusChip";
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
  const selected = api.operations.find((op) => op.id === selectedOpId);

  return (
    <ProductPageShell
      crumbs={[{ to: "/developers", label: "APIs" }]}
      current={api.name}
    >
      <ProductPageHeader
        extra={<StatusChip status="warning">Sandbox only</StatusChip>}
        title={api.name}
        description={api.description}
      />
      <p className="text-type-12 text-muted-foreground">
        Base {api.basePath} · mock try-it · no production writes
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(11rem,14rem)_minmax(0,1fr)_minmax(16rem,20rem)] lg:items-start">
        <aside className="border-b border-border py-space-16 lg:border-b-0 lg:border-r lg:pr-space-16">
          <p className="mb-space-8 text-type-12 font-medium uppercase tracking-wide text-muted-foreground">
            Catalog
          </p>
          <Stack gap="sm">
            {allApis.map((item) => (
              <Button
                key={item.id}
                asChild
                size="sm"
                variant={item.id === api.id ? "secondary" : "ghost"}
              >
                <Link to={`/developers/apis/${item.id}`}>{item.name}</Link>
              </Button>
            ))}
          </Stack>
        </aside>

        <section className="border-b border-border py-space-16 lg:border-b-0 lg:border-r lg:px-space-16">
          <Stack gap="md">
            {api.operations.map((op) => (
              <button
                key={op.id}
                type="button"
                onClick={() => setSelectedOpId(op.id)}
                className={`p-space-12 w-full rounded-sm border text-left text-type-14 ${
                  selectedOpId === op.id
                    ? "bg-muted/40 border-primary"
                    : "border-border"
                }`}
              >
                <span className="font-mono text-type-12 text-muted-foreground">
                  {op.method}
                </span>{" "}
                <span className="font-mono text-foreground">{op.path}</span>
                <p className="mt-space-8 text-muted-foreground">{op.summary}</p>
              </button>
            ))}
          </Stack>
        </section>

        <aside className="py-space-16 lg:pl-space-16">
          <p className="text-type-12 font-medium uppercase tracking-wide text-muted-foreground">
            Try it (mock)
          </p>
          {selected ? (
            <Form method="post" className="mt-space-8">
              <input type="hidden" name="operationId" value={selected.id} />
              <Button type="submit" size="sm">
                Send sandbox request
              </Button>
            </Form>
          ) : null}
          {actionData && "body" in actionData ? (
            <pre className="p-space-12 mt-space-16 max-h-80 overflow-auto rounded-sm bg-muted text-type-12">
              {JSON.stringify(actionData, null, 2)}
            </pre>
          ) : null}
          {actionData && "error" in actionData ? (
            <p className="mt-space-16 text-type-14 text-destructive">
              {actionData.error}
            </p>
          ) : null}
        </aside>
      </div>
    </ProductPageShell>
  );
}
