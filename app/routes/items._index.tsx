import type { LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import { listMockItems } from "~/services/mock-items.server";
import { ensureSeeded } from "~/services/seed.server";

export async function loader(_args: LoaderFunctionArgs) {
  await ensureSeeded();
  return { items: listMockItems() };
}

export default function ItemsIndexPage() {
  const { items } = useLoaderData<typeof loader>();

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Items</h1>
        <Link
          to="/items/new"
          className="rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground"
        >
          新增 Item
        </Link>
      </div>

      <div className="grid gap-4">
        {items.map((item) => (
          <Card key={item.id}>
            <CardHeader>
              <CardTitle>{item.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>{item.description ?? "（無描述）"}</p>
              <p>Updated: {item.updatedAt}</p>
              <Link
                to={`/items/${item.id}`}
                className="text-primary hover:underline"
              >
                查看 / 編輯
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
