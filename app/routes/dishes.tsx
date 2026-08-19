import { Outlet, useLocation } from "@remix-run/react";

import { ProductPageShell } from "~/components/shared/product/ProductPageShell";

export default function DishesLayout() {
  const { pathname } = useLocation();
  const onDetail = /^\/dishes\/[^/]+$/.test(pathname);

  return (
    <ProductPageShell
      crumbs={[
        { to: "/", label: "AI Search Portal" },
        ...(onDetail ? [{ to: "/dishes", label: "Dishes" }] : []),
      ]}
      current={onDetail ? "Dish" : "Dishes"}
    >
      <Outlet />
    </ProductPageShell>
  );
}
