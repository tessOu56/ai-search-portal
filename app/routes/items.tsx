import { Outlet, useLocation } from "@remix-run/react";

import { ProductPageShell } from "~/components/shared/product/ProductPageShell";
import { OVERVIEW_HOME } from "~/lib/workspace-mode";

export default function ItemsLayout() {
  const { pathname } = useLocation();
  const onDetail = /^\/items\/[^/]+$/.test(pathname);

  return (
    <ProductPageShell
      crumbs={[
        { to: OVERVIEW_HOME, label: "AI Search Portal" },
        ...(onDetail ? [{ to: "/items", label: "Items" }] : []),
      ]}
      current={onDetail ? "Item" : "Items"}
    >
      <Outlet />
    </ProductPageShell>
  );
}
