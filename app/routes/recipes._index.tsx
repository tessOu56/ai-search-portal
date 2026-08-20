import type { LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";

import { ProductPageHeader } from "~/components/shared/product/ProductPageShell";
import { DataTable } from "~/components/ui/DataTable";
import { EmptyState } from "~/components/ui/EmptyState";
import { Panel } from "~/components/ui/Panel";
import { Stack } from "~/components/ui/Stack";
import { getAllRecipes } from "~/features/recipe/recipe.server";
import { PRODUCT_TABLE_LINK_CLASS } from "~/lib/experience-nav";
import { ensureSeeded } from "~/services/seed.server";
import { useI18n } from "~/shared/i18n/context";

export async function loader(_args: LoaderFunctionArgs) {
  await ensureSeeded();
  return { recipes: getAllRecipes() };
}

export default function RecipesIndexPage() {
  const { recipes } = useLoaderData<typeof loader>();
  const { t } = useI18n();
  return (
    <Stack gap="lg">
      <ProductPageHeader
        title={t("nav.recipes")}
        description="Seeded lab records — open a row for steps and properties."
      />
      {recipes.length === 0 ? (
        <EmptyState title="尚無 Recipe" />
      ) : (
        <Panel className="overflow-x-auto">
          <DataTable
            columns={[
              {
                key: "title",
                header: "Title",
                accessor: (row) => (
                  <Link
                    to={`/recipes/${row.id}`}
                    className={PRODUCT_TABLE_LINK_CLASS}
                  >
                    {row.title}
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
                key: "dish",
                header: "Dish",
                accessor: (row) => (
                  <span className="text-muted-foreground">{row.dishName}</span>
                ),
              },
            ]}
            rows={recipes}
            getRowKey={(row) => row.id}
          />
        </Panel>
      )}
    </Stack>
  );
}
