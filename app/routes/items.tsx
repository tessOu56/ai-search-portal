import { Outlet, useLocation } from "@remix-run/react";

import { ProductPageShell } from "~/components/shared/product/ProductPageShell";
import { OVERVIEW_HOME } from "~/lib/workspace-mode";
import { useI18n } from "~/shared/i18n/context";

export default function ItemsLayout() {
  const { t } = useI18n();
  const { pathname } = useLocation();
  const onDetail = /^\/items\/[^/]+$/.test(pathname);

  return (
    <ProductPageShell
      crumbs={[
        { to: OVERVIEW_HOME, label: t("app.title") },
        ...(onDetail ? [{ to: "/items", label: t("nav.items") }] : []),
      ]}
      current={onDetail ? t("nav.item") : t("nav.items")}
    >
      <Outlet />
    </ProductPageShell>
  );
}
