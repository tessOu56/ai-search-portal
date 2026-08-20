import { Outlet, useLocation } from "@remix-run/react";

import { ProductPageShell } from "~/components/shared/product/ProductPageShell";
import { OVERVIEW_HOME } from "~/lib/workspace-mode";
import { useI18n } from "~/shared/i18n/context";

export default function CatalogSearchLayout() {
  const { t } = useI18n();
  const { pathname } = useLocation();
  const onDictionary = pathname.includes("/dictionary");

  return (
    <ProductPageShell
      crumbs={[
        { to: OVERVIEW_HOME, label: t("app.title") },
        ...(onDictionary
          ? [{ to: "/catalog-search", label: t("nav.catalog-search") }]
          : []),
      ]}
      current={
        onDictionary ? t("nav.catalog-dictionary") : t("nav.catalog-search")
      }
    >
      <Outlet />
    </ProductPageShell>
  );
}
