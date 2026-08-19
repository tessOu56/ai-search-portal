import { Outlet, useLocation } from "@remix-run/react";

import { ProductPageShell } from "~/components/shared/product/ProductPageShell";

export default function ItemsLayout() {
  const { pathname } = useLocation();
  const onNew = pathname.endsWith("/new");
  const onDetail = /^\/items\/[^/]+$/.test(pathname) && !onNew;

  return (
    <ProductPageShell
      crumbs={[
        { to: "/", label: "AI Search Portal" },
        ...(onNew || onDetail ? [{ to: "/items", label: "Items" }] : []),
      ]}
      current={onNew ? "New item" : onDetail ? "Item" : "Items"}
    >
      <Outlet />
    </ProductPageShell>
  );
}
