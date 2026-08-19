import { Outlet, useLocation } from "@remix-run/react";

import { ProductPageShell } from "~/components/shared/product/ProductPageShell";
import { OVERVIEW_HOME } from "~/lib/workspace-mode";

export default function CatalogSearchLayout() {
  const { pathname } = useLocation();
  const onDictionary = pathname.includes("/dictionary");

  return (
    <ProductPageShell
      crumbs={[
        { to: OVERVIEW_HOME, label: "AI Search Portal" },
        ...(onDictionary
          ? [{ to: "/catalog-search", label: "Catalog search" }]
          : []),
      ]}
      current={onDictionary ? "Dictionary" : "Catalog search"}
    >
      <Outlet />
    </ProductPageShell>
  );
}
