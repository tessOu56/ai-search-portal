import type { LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";

import { ProductPageHeader } from "~/components/shared/product/ProductPageShell";
import { Button } from "~/components/ui/Button";
import { EmptyState } from "~/components/ui/EmptyState";
import { Panel } from "~/components/ui/Panel";
import { Stack } from "~/components/ui/Stack";
import { StatusChip } from "~/components/ui/StatusChip";
import { getDish } from "~/features/dish/dish.server";
import { getRecipesByDishId } from "~/features/recipe/recipe.server";
import { getVendorsByDishId } from "~/features/vendor/vendor.server";
import { PRODUCT_TABLE_LINK_CLASS } from "~/lib/experience-nav";
import { ensureSeeded } from "~/services/seed.server";

export async function loader({ params }: LoaderFunctionArgs) {
  await ensureSeeded();
  const dishId = params.dishId;
  if (!dishId) throw new Response("Missing dishId", { status: 400 });
  const dish = getDish(dishId);
  if (!dish) throw new Response("Dish not found", { status: 404 });
  return {
    dish,
    recipes: getRecipesByDishId(dishId),
    vendors: getVendorsByDishId(dishId),
  };
}

export default function DishDetailPage() {
  const { dish, recipes, vendors } = useLoaderData<typeof loader>();
  return (
    <Stack gap="lg">
      <ProductPageHeader
        title={dish.name}
        description={dish.description ?? "（無描述）"}
      />

      <Panel>
        <h2 className="mb-3 text-type-16 font-semibold">功效</h2>
        <div className="flex flex-wrap gap-space-8">
          {dish.properties.map((prop) => (
            <StatusChip key={prop} status="info">
              {prop}
            </StatusChip>
          ))}
        </div>
      </Panel>

      <Panel>
        <h2 className="mb-3 text-type-16 font-semibold">原料</h2>
        {dish.ingredients.length === 0 ? (
          <EmptyState density="inline" title="尚無原料" />
        ) : (
          <ul className="space-y-2 text-sm text-muted-foreground">
            {dish.ingredients.map((usage) => (
              <li key={usage.ingredientId}>
                {usage.ingredientName} · {usage.amount}
                {usage.unit}
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel>
        <h2 className="mb-3 text-type-16 font-semibold">相關食譜</h2>
        {recipes.length === 0 ? (
          <EmptyState density="inline" title="尚無食譜" />
        ) : (
          <ul className="space-y-2 text-sm">
            {recipes.map((recipe) => (
              <li key={recipe.id}>
                <Link
                  to={`/recipes/${recipe.id}`}
                  className={PRODUCT_TABLE_LINK_CLASS}
                >
                  {recipe.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel>
        <h2 className="mb-3 text-type-16 font-semibold">購買通路</h2>
        {vendors.length === 0 ? (
          <EmptyState density="inline" title="尚無通路資料" />
        ) : (
          <ul className="space-y-2 text-sm text-muted-foreground">
            {vendors.map((vendor) => (
              <li key={vendor.id}>{vendor.name}</li>
            ))}
          </ul>
        )}
      </Panel>

      <Button asChild variant="outline">
        <Link to="/dishes">返回 Dish 列表</Link>
      </Button>
    </Stack>
  );
}
