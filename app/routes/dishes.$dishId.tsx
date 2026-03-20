import type { LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";

import { Badge } from "~/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import { getDish } from "~/features/dish/dish.server";
import { getRecipesByDishId } from "~/features/recipe/recipe.server";
import { getVendorsByDishId } from "~/features/vendor/vendor.server";
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
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{dish.name}</h1>
        <p className="mt-2 text-muted-foreground">
          {dish.description ?? "（無描述）"}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>功效</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {dish.properties.map((prop) => (
            <Badge key={prop} variant="secondary">
              {prop}
            </Badge>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>相關食譜</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {recipes.map((recipe) => (
            <p key={recipe.id}>
              <Link
                to={`/recipes/${recipe.id}`}
                className="text-primary hover:underline"
              >
                {recipe.title}
              </Link>
            </p>
          ))}
          {recipes.length === 0 && (
            <p className="text-muted-foreground">尚無食譜</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>購買通路</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          {vendors.map((vendor) => (
            <p key={vendor.id}>{vendor.name}</p>
          ))}
          {vendors.length === 0 && <p>尚無通路資料</p>}
        </CardContent>
      </Card>

      <Link to="/dishes" className="text-primary hover:underline">
        返回 Dish 列表
      </Link>
    </section>
  );
}
