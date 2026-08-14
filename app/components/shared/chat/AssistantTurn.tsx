import { inferIndustryFacetsFromText } from "@ai-search-portal/contracts";
import { Link } from "@remix-run/react";

import { AiFallbackPanel } from "~/components/shared/chat/AiFallbackPanel";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/Alert";
import { Button } from "~/components/ui/Button";
import { useI18n } from "~/shared/i18n/context";
import {
  buildCatalogSearchUrl,
  buildMetadataSearchUrl,
} from "~/shared/navigation";

export type AssistantSource = {
  title: string;
  url: string;
  source?: string;
};

export type AssistantTurnProps = {
  content: string;
  isStreaming?: boolean;
  summary?: string;
  confidence?: number;
  sources?: AssistantSource[];
  nextSteps?: string[];
  query?: string;
  showContinue?: boolean;
  error?: string | null;
};

const CHIP_CLASS =
  "h-auto min-h-8 max-w-full whitespace-normal break-words py-1.5 text-left";

const SOURCE_LINK_CLASS = "text-primary hover:underline";
const KEY_SOURCES_TITLE = "chat.sources.title";

function EvidenceHeader({
  summary,
  confidence,
}: {
  summary?: string;
  confidence?: number;
}) {
  const { t } = useI18n();
  if (!summary && confidence === undefined) return null;
  return (
    <header className="flex flex-wrap items-baseline gap-space-8">
      {summary ? (
        <p className="text-type-16 text-foreground">{summary}</p>
      ) : null}
      {confidence !== undefined ? (
        <span className="font-mono text-type-12 text-muted-foreground">
          {t("chat.confidence")} {Math.round(confidence * 100)}%
        </span>
      ) : null}
    </header>
  );
}

function StreamBody({
  content,
  isStreaming,
}: {
  content: string;
  isStreaming: boolean;
}) {
  if (!content && !isStreaming) return null;
  return (
    <p className="whitespace-pre-wrap text-type-16 leading-relaxed text-foreground">
      {content}
      {isStreaming ? (
        <span
          data-testid="assistant-stream-cursor"
          className="bg-foreground/70 ml-0.5 inline-block h-[1em] w-px translate-y-0.5 animate-pulse motion-reduce:animate-none"
          aria-hidden
        />
      ) : null}
    </p>
  );
}

function TurnError({ query, error }: { query: string; error: string }) {
  const { t } = useI18n();
  return (
    <>
      <Alert
        role="alert"
        className="border-destructive/20 bg-destructive/5 text-destructive"
      >
        <AlertTitle>{t("chat.error.title")}</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
      <AiFallbackPanel query={query} />
    </>
  );
}

function NextSteps({ steps }: { steps: string[] }) {
  const { t } = useI18n();
  if (steps.length === 0) return null;
  return (
    <div>
      <h3 className="mb-space-8 text-type-14 font-medium text-foreground">
        {t("chat.next.title")}
      </h3>
      <ul className="space-y-space-8 text-type-14 text-muted-foreground">
        {steps.map((step) => (
          <li key={step} className="flex items-start gap-2">
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
            <span>{step}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SourceLink({ source }: { source: AssistantSource }) {
  const { t } = useI18n();
  const sourcesLabel = t(KEY_SOURCES_TITLE);
  const internal = source.url.startsWith("/");
  const label = `${source.title} (${sourcesLabel})`;
  return (
    <li className="space-y-0.5">
      {internal ? (
        <Link to={source.url} className={SOURCE_LINK_CLASS} aria-label={label}>
          {source.title}
        </Link>
      ) : (
        <a
          href={source.url}
          className={SOURCE_LINK_CLASS}
          rel="noreferrer"
          target="_blank"
          aria-label={label}
        >
          {source.title}
        </a>
      )}
      {source.source ? (
        <p className="text-muted-foreground/80 text-xs">{source.source}</p>
      ) : null}
    </li>
  );
}

function Sources({ sources }: { sources: AssistantSource[] }) {
  const { t } = useI18n();
  if (sources.length === 0) return null;
  return (
    <div>
      <h3 className="mb-space-8 text-type-14 font-medium text-foreground">
        {t(KEY_SOURCES_TITLE)}
      </h3>
      <ul className="space-y-space-8 text-type-14">
        {sources.map((source) => (
          <SourceLink key={source.url} source={source} />
        ))}
      </ul>
    </div>
  );
}

function ContinueFacets({ query }: { query: string }) {
  const { t } = useI18n();
  const inferred = inferIndustryFacetsFromText(query);
  const facetLabel = [
    inferred.standard,
    inferred.productType,
    inferred.auctionEligible ? "auction" : undefined,
  ]
    .filter(Boolean)
    .join(" · ");
  const facetQuery = {
    q: query,
    material: inferred.material,
    standard: inferred.standard,
    productType: inferred.productType,
    auctionEligible: inferred.auctionEligible,
    intent: "manual" as const,
  };

  return (
    <div
      className="flex flex-wrap gap-2 pt-space-8"
      data-testid="chat-continue-facets"
    >
      <Button asChild variant="outline" size="sm" className={CHIP_CLASS}>
        <Link
          to={buildCatalogSearchUrl(facetQuery)}
          data-testid="chat-continue-catalog"
        >
          {t("chat.continue.catalog")}
          {facetLabel ? ` · ${facetLabel}` : ""}
        </Link>
      </Button>
      <Button asChild variant="outline" size="sm" className={CHIP_CLASS}>
        <Link
          to={buildMetadataSearchUrl(facetQuery)}
          data-testid="chat-continue-metadata"
        >
          {t("chat.continue.metadata")}
        </Link>
      </Button>
    </div>
  );
}

/**
 * One assistant turn as a document: summary, streamed body, sources, next steps.
 * Empty evidence is omitted — no waiting cards.
 * Surface: product (chat).
 */
export function AssistantTurn({
  content,
  isStreaming = false,
  summary,
  confidence,
  sources = [],
  nextSteps = [],
  query = "",
  showContinue = false,
  error = null,
}: AssistantTurnProps) {
  const showContinueRow =
    showContinue && !isStreaming && !error && Boolean(query.trim());

  return (
    <article
      data-testid="assistant-turn"
      className="w-full max-w-3xl space-y-space-16"
    >
      <EvidenceHeader summary={summary} confidence={confidence} />
      <StreamBody content={content} isStreaming={isStreaming} />
      {error ? <TurnError query={query} error={error} /> : null}
      {!isStreaming ? <NextSteps steps={nextSteps} /> : null}
      {!isStreaming ? <Sources sources={sources} /> : null}
      {showContinueRow ? <ContinueFacets query={query} /> : null}
    </article>
  );
}
