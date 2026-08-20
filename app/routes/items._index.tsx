import type { LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";

import { ProductPageHeader } from "~/components/shared/product/ProductPageShell";
import { DataTable } from "~/components/ui/DataTable";
import { EmptyState } from "~/components/ui/EmptyState";
import { Stack } from "~/components/ui/Stack";
import { PRODUCT_TABLE_LINK_CLASS } from "~/lib/experience-nav";
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
        description="Read-only seeded catalog records."
      />

      {items.length === 0 ? (
        <EmptyState title="No items yet" />
      ) : (
        <div className="overflow-x-auto">
          <DataTable
            columns={[
              {
                key: "name",
                header: "Name",
                accessor: (row) => (
                  <Link
                    to={`/items/${row.id}`}
                    className={PRODUCT_TABLE_LINK_CLASS}
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
        </div>
      )}
    </Stack>
  );
}
