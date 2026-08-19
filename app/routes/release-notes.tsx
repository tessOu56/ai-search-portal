import { Outlet, useLocation } from "@remix-run/react";

import { ProductPageShell } from "~/components/shared/product/ProductPageShell";
import { useI18n } from "~/shared/i18n/context";

export default function ReleaseNotesLayout() {
  const { t } = useI18n();
  const { pathname } = useLocation();
  const onVersion = /^\/release-notes\/.+$/.test(pathname);
  const versionLabel = pathname.split("/").pop() ?? "Version";

  return (
    <ProductPageShell
      crumbs={[
        { to: "/", label: t("app.title") },
        ...(onVersion
          ? [{ to: "/release-notes", label: t("release-notes.page.title") }]
          : []),
      ]}
      current={onVersion ? `v${versionLabel}` : t("release-notes.page.title")}
    >
      <Outlet />
    </ProductPageShell>
  );
}
