import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { Form, Link, useLoaderData } from "@remix-run/react";

import { Button } from "~/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import { Input } from "~/components/ui/Input";
import { Textarea } from "~/components/ui/Textarea";
import {
  deleteMockItem,
  getMockItem,
  updateMockItem,
} from "~/services/mock-items.server";

export function loader({ params }: LoaderFunctionArgs) {
  const itemId = params.itemId;
  if (!itemId) throw new Response("Missing itemId", { status: 400 });
  const item = getMockItem(itemId);
  if (!item) throw new Response("Not found", { status: 404 });
  return { item };
}

export async function action({ request, params }: ActionFunctionArgs) {
  const itemId = params.itemId;
  if (!itemId) throw new Response("Missing itemId", { status: 400 });

  const form = await request.formData();
  const intent = String(form.get("intent") ?? "update");

  if (intent === "delete") {
    deleteMockItem(itemId);
    return redirect("/items");
  }

  const name = String(form.get("name") ?? "").trim();
  const descriptionRaw = String(form.get("description") ?? "").trim();
  if (!name) return new Response("Name is required", { status: 400 });

  updateMockItem(itemId, {
    name,
    description: descriptionRaw.length > 0 ? descriptionRaw : null,
  });
  return redirect(`/items/${itemId}`);
}

export default function ItemDetailPage() {
  const { item } = useLoaderData<typeof loader>();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Item #{item.id}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form method="post" className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              名稱
            </label>
            <Input id="name" name="name" defaultValue={item.name} required />
          </div>
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              描述
            </label>
            <Textarea
              id="description"
              name="description"
              defaultValue={item.description ?? ""}
            />
          </div>
          <div className="flex gap-3">
            <Button type="submit">儲存</Button>
            <Button asChild variant="outline">
              <Link to="/items">返回列表</Link>
            </Button>
          </div>
        </Form>

        <Form method="post" className="mt-4">
          <input type="hidden" name="intent" value="delete" />
          <Button type="submit" variant="outline">
            刪除 Item
          </Button>
        </Form>
      </CardContent>
    </Card>
  );
}
