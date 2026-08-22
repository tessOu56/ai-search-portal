import type { LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";

import { ProductPageHeader } from "~/components/shared/product/ProductPageShell";
import { Button } from "~/components/ui/Button";
import { Panel } from "~/components/ui/Panel";
import { Stack } from "~/components/ui/Stack";
import { StatusChip } from "~/components/ui/StatusChip";
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
    <Stack gap="lg">
      <ProductPageHeader
        title={recipe.title}
        description={recipe.description ?? "（無描述）"}
      />

      <Panel>
        <h2 className="mb-3 text-type-16 font-semibold">步驟</h2>
        <ol className="space-y-2 text-sm">
          {recipe.instructions.map((step) => (
            <li key={step.stepNumber}>
              {step.stepNumber}. {step.instruction}
            </li>
          ))}
        </ol>
      </Panel>

      <Panel>
        <h2 className="mb-3 text-type-16 font-semibold">功效</h2>
        <div className="flex flex-wrap gap-space-8">
          {recipe.properties.map((prop) => (
            <StatusChip key={prop} status="info">
              {prop}
            </StatusChip>
          ))}
        </div>
      </Panel>

      <Button asChild variant="outline">
        <Link to="/recipes">返回 Recipe 列表</Link>
      </Button>
    </Stack>
  );
}
