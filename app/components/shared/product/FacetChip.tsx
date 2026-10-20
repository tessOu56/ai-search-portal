import type { ReactNode } from "react";
import { Link } from "react-router";

import { Button } from "~/components/ui/Button";

type FacetChipProps = {
  to: string;
  active: boolean;
  children: ReactNode;
  title?: string;
};

/** Filter chip that exposes the selected state to assistive tech. */
export function FacetChip({ to, active, children, title }: FacetChipProps) {
  return (
    <Button asChild size="sm" variant={active ? "default" : "outline"}>
      <Link to={to} title={title} aria-current={active ? "true" : undefined}>
        {children}
      </Link>
    </Button>
  );
}
