import { Outlet, useLocation } from "@remix-run/react";

import { ProductPageShell } from "~/components/shared/product/ProductPageShell";
import { OVERVIEW_HOME } from "~/lib/workspace-mode";
import { useI18n } from "~/shared/i18n/context";

export default function DishesLayout() {
  const { t } = useI18n();
  const { pathname } = useLocation();
  const onDetail = /^\/dishes\/[^/]+$/.test(pathname);

  return (
    <ProductPageShell
      crumbs={[
        { to: OVERVIEW_HOME, label: t("app.title") },
        ...(onDetail ? [{ to: "/dishes", label: t("nav.dishes") }] : []),
      ]}
      current={onDetail ? t("nav.dish") : t("nav.dishes")}
    >
      <Outlet />
    </ProductPageShell>
  );
}
