import { Outlet, useLocation } from "@remix-run/react";

import { ProductPageShell } from "~/components/shared/product/ProductPageShell";
import { OVERVIEW_HOME } from "~/lib/workspace-mode";

export default function DishesLayout() {
  const { pathname } = useLocation();
  const onDetail = /^\/dishes\/[^/]+$/.test(pathname);

  return (
    <ProductPageShell
      crumbs={[
        { to: OVERVIEW_HOME, label: "AI Search Portal" },
        ...(onDetail ? [{ to: "/dishes", label: "Dishes" }] : []),
      ]}
      current={onDetail ? "Dish" : "Dishes"}
    >
      <Outlet />
    </ProductPageShell>
  );
}
