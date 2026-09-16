import type { MetaFunction } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";

import {
  ProductPageHeader,
  ProductPageShell,
} from "~/components/shared/product/ProductPageShell";
import { Button } from "~/components/ui/Button";
import { Panel } from "~/components/ui/Panel";
import { Stack } from "~/components/ui/Stack";
import { StatusChip } from "~/components/ui/StatusChip";
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
    <ProductPageShell current="APIs">
      <ProductPageHeader
        extra={
          <StatusChip status="neutral">Developer Hub · sandbox</StatusChip>
        }
        title="APIs"
        description="Read-only catalog. Try-it returns labelled mock responses — no production writes, real keys, Neon, or dishes REST."
      />
      <Stack gap="md">
        {apis.map((api) => (
          <Panel key={api.id}>
            <Stack gap="sm">
              <div className="flex flex-wrap items-start justify-between gap-stack-dense">
                <h2 className="font-display text-type-20 font-medium tracking-tight text-foreground">
                  {api.name}
                </h2>
                <p className="text-type-12 text-muted-foreground">
                  {api.basePath} · v{api.version}
                </p>
              </div>
              <p className="max-w-2xl text-type-14 text-muted-foreground">
                {api.description}
              </p>
              <div>
                <Button asChild size="sm" variant="outline">
                  <Link to={`/developers/apis/${api.id}`}>Open explorer</Link>
                </Button>
              </div>
            </Stack>
          </Panel>
        ))}
      </Stack>
    </ProductPageShell>
  );
}
