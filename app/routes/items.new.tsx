import type { ActionFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { Form, Link } from "@remix-run/react";

import { Button } from "~/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import { Input } from "~/components/ui/Input";
import { Textarea } from "~/components/ui/Textarea";
import { createMockItem } from "~/services/mock-items.server";

export async function action({ request }: ActionFunctionArgs) {
  const form = await request.formData();
  const name = String(form.get("name") ?? "").trim();
  const descriptionRaw = String(form.get("description") ?? "").trim();

  if (!name) return new Response("Name is required", { status: 400 });

  const created = createMockItem({
    name,
    description: descriptionRaw.length > 0 ? descriptionRaw : null,
  });
  return redirect(`/items/${created.id}`);
}

export default function ItemCreatePage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>新增 Item</CardTitle>
      </CardHeader>
      <CardContent>
        <Form method="post" className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              名稱
            </label>
            <Input id="name" name="name" required />
          </div>
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              描述
            </label>
            <Textarea id="description" name="description" />
          </div>
          <div className="flex gap-3">
            <Button type="submit">建立</Button>
            <Button asChild variant="outline">
              <Link to="/items">返回列表</Link>
            </Button>
          </div>
        </Form>
      </CardContent>
    </Card>
  );
}
