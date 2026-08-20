import { Outlet, useLocation } from "@remix-run/react";

import { ProductPageShell } from "~/components/shared/product/ProductPageShell";
import { OVERVIEW_HOME } from "~/lib/workspace-mode";
import { useI18n } from "~/shared/i18n/context";

export default function MetadataLayout() {
  const { t } = useI18n();
  const { pathname } = useLocation();
  const onDetail = /^\/metadata\/[^/]+$/.test(pathname);

  return (
    <ProductPageShell
      crumbs={[
        { to: OVERVIEW_HOME, label: t("app.title") },
        ...(onDetail ? [{ to: "/metadata", label: t("nav.metadata") }] : []),
      ]}
      current={onDetail ? t("nav.asset") : t("nav.metadata")}
    >
      <Outlet />
    </ProductPageShell>
  );
}
