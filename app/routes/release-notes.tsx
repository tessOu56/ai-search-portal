import { Link, Outlet } from "@remix-run/react";

import { Container } from "~/components/ui/Container";
import { useI18n } from "~/shared/i18n/context";

export default function ReleaseNotesLayout() {
  const { t } = useI18n();
  return (
    <div className="min-h-screen bg-background">
      <Container className="py-10">
        <nav
          className="mb-6 text-sm text-muted-foreground"
          aria-label="Breadcrumb"
        >
          <Link to="/" className="hover:text-foreground hover:underline">
            {t("app.title")}
          </Link>
          <span className="mx-2" aria-hidden>
            /
          </span>
          <span className="text-foreground">
            {t("release-notes.page.title")}
          </span>
        </nav>
        <Outlet />
      </Container>
    </div>
  );
}
