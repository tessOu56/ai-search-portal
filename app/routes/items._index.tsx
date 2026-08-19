import type { LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";

import { ProductPageHeader } from "~/components/shared/product/ProductPageShell";
import { Button } from "~/components/ui/Button";
import { DataTable } from "~/components/ui/DataTable";
import { EmptyState } from "~/components/ui/EmptyState";
import { Stack } from "~/components/ui/Stack";
import { listMockItems } from "~/services/mock-items.server";
import { ensureSeeded } from "~/services/seed.server";

export async function loader(_args: LoaderFunctionArgs) {
  await ensureSeeded();
  return { items: listMockItems() };
}

export default function ItemsIndexPage() {
  const { items } = useLoaderData<typeof loader>();

  return (
    <Stack gap="lg">
      <ProductPageHeader
        title="Items"
        description="Lab CRUD list for catalog-shaped records."
        actions={
          <Button asChild>
            <Link to="/items/new">新增 Item</Link>
          </Button>
        }
      />

      {items.length === 0 ? (
        <EmptyState
          title="No items yet"
          action={
            <Button asChild>
              <Link to="/items/new">新增 Item</Link>
            </Button>
          }
        />
      ) : (
        <DataTable
          columns={[
            {
              key: "name",
              header: "Name",
              accessor: (row) => (
                <Link
                  to={`/items/${row.id}`}
                  className="font-medium text-primary hover:underline"
                >
                  {row.name}
                </Link>
              ),
            },
            {
              key: "description",
              header: "Description",
              accessor: (row) => (
                <span className="text-muted-foreground">
                  {row.description ?? "（無描述）"}
                </span>
              ),
            },
            {
              key: "updated",
              header: "Updated",
              accessor: (row) => (
                <span className="text-muted-foreground">{row.updatedAt}</span>
              ),
            },
          ]}
          rows={items}
          getRowKey={(row) => row.id}
        />
      )}
    </Stack>
  );
}
