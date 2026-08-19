import type { LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";

import { ProductPageHeader } from "~/components/shared/product/ProductPageShell";
import { DataTable } from "~/components/ui/DataTable";
import { EmptyState } from "~/components/ui/EmptyState";
import { Stack } from "~/components/ui/Stack";
import { getAllRecipes } from "~/features/recipe/recipe.server";
import { ensureSeeded } from "~/services/seed.server";

export async function loader(_args: LoaderFunctionArgs) {
  await ensureSeeded();
  return { recipes: getAllRecipes() };
}

export default function RecipesIndexPage() {
  const { recipes } = useLoaderData<typeof loader>();
  return (
    <Stack gap="lg">
      <ProductPageHeader
        title="Recipes"
        description="Seeded lab records — open a row for steps and properties."
      />
      {recipes.length === 0 ? (
        <EmptyState title="尚無 Recipe" />
      ) : (
        <DataTable
          columns={[
            {
              key: "title",
              header: "Title",
              accessor: (row) => (
                <Link
                  to={`/recipes/${row.id}`}
                  className="font-medium text-primary hover:underline"
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
      )}
    </Stack>
  );
}
