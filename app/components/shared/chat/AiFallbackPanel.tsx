import {
  inferIndustryFacetsFromText,
  listIndustryStandards,
} from "@ai-search-portal/contracts";
import { Link } from "@remix-run/react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/Card";
import { useI18n } from "~/shared/i18n/context";
import {
  buildCatalogSearchUrl,
  buildMetadataSearchUrl,
  type CatalogSearchUrlParams,
} from "~/shared/navigation";

export type AiFallbackPanelProps = {
  /** The user's last query — preserved so the manual path can take over. */
  query: string;
  /** Quick type-filter shortcuts offered alongside the main takeover link. */
  types?: string[];
};

const INDUSTRY_SHORTCUTS = listIndustryStandards()
  .filter((e) => ["925", "18K", "950"].includes(e.code))
  .map((e) => ({
    code: e.code,
    material: e.material,
    label: e.code,
  }));

const COMMERCE_SHORTCUTS = [
  { productType: "experience" as const, label: "Experience" },
  { productType: "physical" as const, label: "Physical" },
  { auctionEligible: true as const, label: "Auction" },
];

const AI_FALLBACK_INTENT = "ai-fallback";

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
  const inferred = inferIndustryFacetsFromText(trimmed);
  const fallbackIntent: CatalogSearchUrlParams = {
    intent: AI_FALLBACK_INTENT,
    material: inferred.material,
    standard: inferred.standard,
    productType: inferred.productType,
    auctionEligible: inferred.auctionEligible,
  };

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
          to={buildCatalogSearchUrl({ q: trimmed, ...fallbackIntent })}
          className="inline-flex h-9 items-center rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90"
          data-testid="ai-fallback-takeover"
        >
          {trimmed
            ? t("chat.fallback.action.query", { query: trimmed })
            : t("chat.fallback.action")}
        </Link>
        <Link
          to={buildMetadataSearchUrl({ q: trimmed, ...fallbackIntent })}
          className="inline-flex h-9 items-center rounded-full border border-border bg-background px-4 text-sm font-medium hover:bg-muted"
          data-testid="ai-fallback-metadata"
        >
          {trimmed
            ? t("chat.fallback.metadata.query", { query: trimmed })
            : t("chat.fallback.metadata")}
        </Link>
        {types.map((type) => (
          <Link
            key={type}
            to={buildCatalogSearchUrl({ q: trimmed, type, ...fallbackIntent })}
            className="inline-flex h-8 items-center rounded-full border border-border bg-background px-3 text-xs font-medium hover:bg-muted"
            data-testid={`ai-fallback-type-${type}`}
          >
            {type}
          </Link>
        ))}
        {INDUSTRY_SHORTCUTS.map((chip) => (
          <Link
            key={chip.code}
            to={buildCatalogSearchUrl({
              q: trimmed,
              intent: AI_FALLBACK_INTENT,
              material: chip.material,
              standard: chip.code,
            })}
            className="inline-flex h-8 items-center rounded-full border border-amber-400/50 bg-background px-3 text-xs font-medium hover:bg-muted"
            data-testid={`ai-fallback-standard-${chip.code}`}
          >
            {chip.label}
          </Link>
        ))}
        {COMMERCE_SHORTCUTS.map((chip) => (
          <Link
            key={chip.label}
            to={buildCatalogSearchUrl({
              q: trimmed,
              intent: AI_FALLBACK_INTENT,
              productType: "productType" in chip ? chip.productType : undefined,
              auctionEligible:
                "auctionEligible" in chip ? chip.auctionEligible : undefined,
            })}
            className="inline-flex h-8 items-center rounded-full border border-amber-400/50 bg-background px-3 text-xs font-medium hover:bg-muted"
            data-testid={`ai-fallback-commerce-${chip.label.toLowerCase()}`}
          >
            {chip.label}
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
