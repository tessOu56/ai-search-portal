import type { LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";

import { Badge } from "~/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import { getRecipe } from "~/features/recipe/recipe.server";
import { ensureSeeded } from "~/services/seed.server";

export async function loader({ params }: LoaderFunctionArgs) {
  await ensureSeeded();
  const recipeId = params.recipeId;
  if (!recipeId) throw new Response("Missing recipeId", { status: 400 });
  const recipe = getRecipe(recipeId);
  if (!recipe) throw new Response("Recipe not found", { status: 404 });
  return { recipe };
}

export default function RecipeDetailPage() {
  const { recipe } = useLoaderData<typeof loader>();
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{recipe.title}</h1>
        <p className="mt-2 text-muted-foreground">
          {recipe.description ?? "（無描述）"}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>步驟</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {recipe.instructions.map((step) => (
            <p key={step.stepNumber}>
              {step.stepNumber}. {step.instruction}
            </p>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>功效</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {recipe.properties.map((prop) => (
            <Badge key={prop} variant="secondary">
              {prop}
            </Badge>
          ))}
        </CardContent>
      </Card>

      <Link to="/recipes" className="text-primary hover:underline">
        返回 Recipe 列表
      </Link>
    </section>
  );
}
