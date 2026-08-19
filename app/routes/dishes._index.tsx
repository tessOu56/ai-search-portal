import type { LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";

import { ProductPageHeader } from "~/components/shared/product/ProductPageShell";
import { DataTable } from "~/components/ui/DataTable";
import { EmptyState } from "~/components/ui/EmptyState";
import { Stack } from "~/components/ui/Stack";
import { getAllDishes } from "~/features/dish/dish.server";
import { ensureSeeded } from "~/services/seed.server";

export async function loader(_args: LoaderFunctionArgs) {
  await ensureSeeded();
  return { dishes: getAllDishes() };
}

export default function DishesIndexPage() {
  const { dishes } = useLoaderData<typeof loader>();
  return (
    <Stack gap="lg">
      <ProductPageHeader
        title="Dishes"
        description="Seeded lab records — open a row for recipes and vendors."
      />
      {dishes.length === 0 ? (
        <EmptyState title="尚無 Dish" />
      ) : (
        <DataTable
          columns={[
            {
              key: "name",
              header: "Name",
              accessor: (row) => (
                <Link
                  to={`/dishes/${row.id}`}
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
              key: "region",
              header: "Region",
              accessor: (row) => (
                <span className="text-muted-foreground">{row.region}</span>
              ),
            },
          ]}
          rows={dishes}
          getRowKey={(row) => row.id}
        />
      )}
    </Stack>
  );
}
