import type { LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";

import { ProductPageHeader } from "~/components/shared/product/ProductPageShell";
import { Button } from "~/components/ui/Button";
import { Panel } from "~/components/ui/Panel";
import { Stack } from "~/components/ui/Stack";
import { getMockItem } from "~/services/mock-items.server";

export function loader({ params }: LoaderFunctionArgs) {
  const itemId = params.itemId;
  if (!itemId) throw new Response("Missing itemId", { status: 400 });
  const item = getMockItem(itemId);
  if (!item) throw new Response("Not found", { status: 404 });
  return { item };
}

export default function ItemDetailPage() {
  const { item } = useLoaderData<typeof loader>();

  return (
    <Stack gap="lg">
      <ProductPageHeader title={`Item #${item.id}`} />
      <Panel>
        <Stack gap="md">
          <div>
            <p className="text-type-12 font-medium text-muted-foreground">
              名稱
            </p>
            <p className="text-type-16 text-foreground">{item.name}</p>
          </div>
          <div>
            <p className="text-type-12 font-medium text-muted-foreground">
              描述
            </p>
            <p className="text-type-16 text-muted-foreground">
              {item.description ?? "（無描述）"}
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/items">返回列表</Link>
          </Button>
        </Stack>
      </Panel>
    </Stack>
  );
}
