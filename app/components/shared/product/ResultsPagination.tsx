import { Link } from "react-router";

import { useI18n } from "~/shared/i18n/context";

type ResultsPaginationProps = {
  page: number;
  totalPages: number;
  prevHref: string;
  nextHref: string;
};

const LINK_CLASS = "text-sm font-medium text-primary hover:underline";
const DISABLED_CLASS = "text-sm text-muted-foreground";

/** Prev/next that keeps inactive controls in the tab order without faking a link. */
export function ResultsPagination({
  page,
  totalPages,
  prevHref,
  nextHref,
}: ResultsPaginationProps) {
  const { t } = useI18n();
  if (totalPages <= 1) return null;

  return (
    <nav
      className="flex items-center justify-between gap-space-8"
      aria-label={t("catalog.results.pagination")}
    >
      {page > 1 ? (
        <Link to={prevHref} className={LINK_CLASS} rel="prev">
          {t("catalog.results.prev")}
        </Link>
      ) : (
        <span className={DISABLED_CLASS} aria-disabled="true">
          {t("catalog.results.prev")}
        </span>
      )}
      <span className="text-type-12 text-muted-foreground">
        {t("catalog.results.pageOf", {
          page: String(page),
          total: String(totalPages),
        })}
      </span>
      {page < totalPages ? (
        <Link to={nextHref} className={LINK_CLASS} rel="next">
          {t("catalog.results.next")}
        </Link>
      ) : (
        <span className={DISABLED_CLASS} aria-disabled="true">
          {t("catalog.results.next")}
        </span>
      )}
    </nav>
  );
}
