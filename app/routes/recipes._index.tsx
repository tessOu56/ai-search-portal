import type { LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import { getAllRecipes } from "~/features/recipe/recipe.server";
import { ensureSeeded } from "~/services/seed.server";

export async function loader(_args: LoaderFunctionArgs) {
  await ensureSeeded();
  return { recipes: getAllRecipes() };
}

export default function RecipesIndexPage() {
  const { recipes } = useLoaderData<typeof loader>();
  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold">Recipe 列表</h1>
      <div className="grid gap-4">
        {recipes.map((recipe) => (
          <Card key={recipe.id}>
            <CardHeader>
              <CardTitle>{recipe.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>{recipe.description ?? "（無描述）"}</p>
              <p>Dish: {recipe.dishName}</p>
              <Link
                to={`/recipes/${recipe.id}`}
                className="text-primary hover:underline"
              >
                查看詳情
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
