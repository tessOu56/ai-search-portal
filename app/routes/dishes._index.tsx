import type { LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import { getAllDishes } from "~/features/dish/dish.server";
import { ensureSeeded } from "~/services/seed.server";

export async function loader(_args: LoaderFunctionArgs) {
  await ensureSeeded();
  return { dishes: getAllDishes() };
}

export default function DishesIndexPage() {
  const { dishes } = useLoaderData<typeof loader>();
  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold">Dish 列表</h1>
      <div className="grid gap-4">
        {dishes.map((dish) => (
          <Card key={dish.id}>
            <CardHeader>
              <CardTitle>{dish.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>{dish.description ?? "（無描述）"}</p>
              <p>Region: {dish.region}</p>
              <Link
                to={`/dishes/${dish.id}`}
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
