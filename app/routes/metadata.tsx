import { Outlet, useLocation } from "@remix-run/react";

import { ProductPageShell } from "~/components/shared/product/ProductPageShell";
import { OVERVIEW_HOME } from "~/lib/workspace-mode";

export default function MetadataLayout() {
  const { pathname } = useLocation();
  const onDetail = /^\/metadata\/[^/]+$/.test(pathname);

  return (
    <ProductPageShell
      crumbs={[
        { to: OVERVIEW_HOME, label: "AI Search Portal" },
        ...(onDetail ? [{ to: "/metadata", label: "Metadata catalog" }] : []),
      ]}
      current={onDetail ? "Asset" : "Metadata catalog"}
    >
      <Outlet />
    </ProductPageShell>
  );
}
