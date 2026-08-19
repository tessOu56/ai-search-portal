import {
  inferIndustryFacetsFromText,
  listIndustryStandards,
} from "@ai-search-portal/contracts";
import { Link } from "@remix-run/react";

import { Button } from "~/components/ui/Button";
import { Panel } from "~/components/ui/Panel";
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
    <Panel data-testid="ai-fallback-panel">
      <h2 className="text-type-16 font-semibold text-foreground">
        {t("chat.fallback.title")}
      </h2>
      <p className="mt-1 text-type-14 text-muted-foreground">
        {t("chat.fallback.description")}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button asChild size="sm">
          <Link
            to={buildCatalogSearchUrl({ q: trimmed, ...fallbackIntent })}
            data-testid="ai-fallback-takeover"
          >
            {trimmed
              ? t("chat.fallback.action.query", { query: trimmed })
              : t("chat.fallback.action")}
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link
            to={buildMetadataSearchUrl({ q: trimmed, ...fallbackIntent })}
            data-testid="ai-fallback-metadata"
          >
            {trimmed
              ? t("chat.fallback.metadata.query", { query: trimmed })
              : t("chat.fallback.metadata")}
          </Link>
        </Button>
        {types.map((type) => (
          <Button asChild key={type} variant="outline" size="sm">
            <Link
              to={buildCatalogSearchUrl({
                q: trimmed,
                type,
                ...fallbackIntent,
              })}
              data-testid={`ai-fallback-type-${type}`}
            >
              {type}
            </Link>
          </Button>
        ))}
        {INDUSTRY_SHORTCUTS.map((chip) => (
          <Button asChild key={chip.code} variant="outline" size="sm">
            <Link
              to={buildCatalogSearchUrl({
                q: trimmed,
                intent: AI_FALLBACK_INTENT,
                material: chip.material,
                standard: chip.code,
              })}
              data-testid={`ai-fallback-standard-${chip.code}`}
            >
              {chip.label}
            </Link>
          </Button>
        ))}
        {COMMERCE_SHORTCUTS.map((chip) => (
          <Button asChild key={chip.label} variant="outline" size="sm">
            <Link
              to={buildCatalogSearchUrl({
                q: trimmed,
                intent: AI_FALLBACK_INTENT,
                productType:
                  "productType" in chip ? chip.productType : undefined,
                auctionEligible:
                  "auctionEligible" in chip ? chip.auctionEligible : undefined,
              })}
              data-testid={`ai-fallback-commerce-${chip.label.toLowerCase()}`}
            >
              {chip.label}
            </Link>
          </Button>
        ))}
      </div>
    </Panel>
  );
}
