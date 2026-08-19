import { Outlet, useLocation } from "@remix-run/react";

import { ProductPageShell } from "~/components/shared/product/ProductPageShell";
import { OVERVIEW_HOME } from "~/lib/workspace-mode";

export default function RecipesLayout() {
  const { pathname } = useLocation();
  const onDetail = /^\/recipes\/[^/]+$/.test(pathname);

  return (
    <ProductPageShell
      crumbs={[
        { to: OVERVIEW_HOME, label: "AI Search Portal" },
        ...(onDetail ? [{ to: "/recipes", label: "Recipes" }] : []),
      ]}
      current={onDetail ? "Recipe" : "Recipes"}
    >
      <Outlet />
    </ProductPageShell>
  );
}
