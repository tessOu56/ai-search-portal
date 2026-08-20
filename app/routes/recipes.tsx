import { Outlet, useLocation } from "@remix-run/react";

import { ProductPageShell } from "~/components/shared/product/ProductPageShell";
import { OVERVIEW_HOME } from "~/lib/workspace-mode";
import { useI18n } from "~/shared/i18n/context";

export default function RecipesLayout() {
  const { t } = useI18n();
  const { pathname } = useLocation();
  const onDetail = /^\/recipes\/[^/]+$/.test(pathname);

  return (
    <ProductPageShell
      crumbs={[
        { to: OVERVIEW_HOME, label: t("app.title") },
        ...(onDetail ? [{ to: "/recipes", label: t("nav.recipes") }] : []),
      ]}
      current={onDetail ? t("nav.recipe") : t("nav.recipes")}
    >
      <Outlet />
    </ProductPageShell>
  );
}
