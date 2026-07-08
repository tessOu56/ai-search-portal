import { Link, Outlet } from "@remix-run/react";

import { Container } from "~/components/ui/Container";

export default function ItemsLayout() {
  return (
    <div className="min-h-screen bg-background">
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
          <span className="text-foreground">Items</span>
        </nav>
        <Outlet />
      </Container>
    </div>
  );
}
