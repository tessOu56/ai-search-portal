import type { ActionFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { Form, Link } from "@remix-run/react";

import { ProductPageHeader } from "~/components/shared/product/ProductPageShell";
import { Button } from "~/components/ui/Button";
import { FormField } from "~/components/ui/FormField";
import { Input } from "~/components/ui/Input";
import { Panel } from "~/components/ui/Panel";
import { Stack } from "~/components/ui/Stack";
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
    <Stack gap="lg">
      <ProductPageHeader title="新增 Item" />
      <Panel>
        <Form method="post" className="space-y-4">
          <FormField label="名稱" required id="name">
            <Input id="name" name="name" required />
          </FormField>
          <FormField label="描述" id="description">
            <Textarea id="description" name="description" />
          </FormField>
          <div className="flex gap-3">
            <Button type="submit">建立</Button>
            <Button asChild variant="outline">
              <Link to="/items">返回列表</Link>
            </Button>
          </div>
        </Form>
      </Panel>
    </Stack>
  );
}
