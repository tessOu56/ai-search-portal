import type { LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";

import { ProductPageHeader } from "~/components/shared/product/ProductPageShell";
import { DataTable } from "~/components/ui/DataTable";
import { EmptyState } from "~/components/ui/EmptyState";
import { Panel } from "~/components/ui/Panel";
import { Stack } from "~/components/ui/Stack";
import { getAllDishes } from "~/features/dish/dish.server";
import { PRODUCT_TABLE_LINK_CLASS } from "~/lib/experience-nav";
import { ensureSeeded } from "~/services/seed.server";
import { useI18n } from "~/shared/i18n/context";

export async function loader(_args: LoaderFunctionArgs) {
  await ensureSeeded();
  return { dishes: getAllDishes() };
}

export default function DishesIndexPage() {
  const { dishes } = useLoaderData<typeof loader>();
  const { t } = useI18n();
  return (
    <Stack gap="lg">
      <ProductPageHeader
        title={t("nav.dishes")}
        description="Seeded lab records — open a row for ingredients, recipes, and vendors."
      />
      {dishes.length === 0 ? (
        <EmptyState title="尚無 Dish" />
      ) : (
        <Panel className="overflow-x-auto">
          <DataTable
            columns={[
              {
                key: "name",
                header: "Name",
                accessor: (row) => (
                  <Link
                    to={`/dishes/${row.id}`}
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
        </Panel>
      )}
    </Stack>
  );
}
