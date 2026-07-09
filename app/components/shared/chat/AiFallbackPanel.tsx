import { Link } from "@remix-run/react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/Card";
import { buildCatalogSearchUrl } from "~/features/catalogsearch/catalog-search-url";
import { useI18n } from "~/shared/i18n/context";

export type AiFallbackPanelProps = {
  /** The user's last query — preserved so the manual path can take over. */
  query: string;
  /** Quick type-filter shortcuts offered alongside the main takeover link. */
  types?: string[];
};

/**
 * Dual-path degradation panel (interface-roadmap R2 ③).
 *
 * Shown when the AI path fails (stream failure / connection loss). The user's
 * input is never lost: it is prefilled into the manual /catalog-search URL
 * (interface-roadmap R2 ① — AI→manual prefill), proving the product promise
 * that every AI path can degrade to an auditable manual path.
 */
export function AiFallbackPanel({
  query,
  types = ["API", "Dataset"],
}: AiFallbackPanelProps) {
  const { t } = useI18n();
  const trimmed = query.trim();

  return (
    <Card
      data-testid="ai-fallback-panel"
      className="border-amber-300/60 bg-amber-50/60"
    >
      <CardHeader>
        <CardTitle className="text-base">{t("chat.fallback.title")}</CardTitle>
        <CardDescription>{t("chat.fallback.description")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-2">
        <Link
          to={buildCatalogSearchUrl({ q: trimmed })}
          className="inline-flex h-9 items-center rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90"
          data-testid="ai-fallback-takeover"
        >
          {trimmed
            ? t("chat.fallback.action.query", { query: trimmed })
            : t("chat.fallback.action")}
        </Link>
        {types.map((type) => (
          <Link
            key={type}
            to={buildCatalogSearchUrl({ q: trimmed, type })}
            className="inline-flex h-8 items-center rounded-full border border-border bg-background px-3 text-xs font-medium hover:bg-muted"
            data-testid={`ai-fallback-type-${type}`}
          >
            {type}
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
