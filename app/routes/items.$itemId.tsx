import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { Form, Link, useLoaderData } from "@remix-run/react";

import { ProductPageHeader } from "~/components/shared/product/ProductPageShell";
import { Button } from "~/components/ui/Button";
import { FormField } from "~/components/ui/FormField";
import { Input } from "~/components/ui/Input";
import { Panel } from "~/components/ui/Panel";
import { Stack } from "~/components/ui/Stack";
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
    <Stack gap="lg">
      <ProductPageHeader title={`Item #${item.id}`} />
      <Panel>
        <Form method="post" className="space-y-4">
          <FormField label="名稱" required id="name">
            <Input id="name" name="name" defaultValue={item.name} required />
          </FormField>
          <FormField label="描述" id="description">
            <Textarea
              id="description"
              name="description"
              defaultValue={item.description ?? ""}
            />
          </FormField>
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
      </Panel>
    </Stack>
  );
}
