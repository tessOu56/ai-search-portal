import { Link, Outlet } from "@remix-run/react";

import { Container } from "~/components/ui/Container";

export default function CatalogSearchLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-background to-brand-50">
      <Container className="py-10">
        <nav
          className="mb-6 text-sm text-muted-foreground"
          aria-label="Breadcrumb"
        >
          <Link to="/" className="hover:text-foreground hover:underline">
            AI Search Portal
          </Link>
          <span className="mx-2" aria-hidden>
            /
          </span>
          <span className="text-foreground">Catalog search</span>
        </nav>
        <Outlet />
      </Container>
    </div>
  );
}
