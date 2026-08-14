import type { WebVitalName } from "@ai-search-portal/contracts";
import type { MetaFunction } from "@remix-run/node";
import { useSyncExternalStore } from "react";

import { Badge } from "~/components/ui/Badge";
import { Button } from "~/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/Card";
import { Container } from "~/components/ui/Container";
import {
  clearVitals,
  getVitals,
  type StoredVital,
  subscribeVitals,
} from "~/lib/analytics/vitals-store";
import { useI18n } from "~/shared/i18n/context";

export const meta: MetaFunction = () => [
  { title: "Web Vitals | AI Search Portal" },
  {
    name: "description",
    content:
      "Live LCP / INP / CLS captured from this browser session — no backend required.",
  },
];

const METRIC_META: Record<
  WebVitalName,
  { label: string; unit: string; blurb: string; thresholds: string }
> = {
  LCP: {
    label: "Largest Contentful Paint",
    unit: "ms",
    blurb: "Time until the largest visible element finishes rendering.",
    thresholds: "good ≤ 2500ms · needs improvement ≤ 4000ms · poor > 4000ms",
  },
  INP: {
    label: "Interaction to Next Paint",
    unit: "ms",
    blurb:
      "Responsiveness of the page to user interactions across its lifetime.",
    thresholds: "good ≤ 200ms · needs improvement ≤ 500ms · poor > 500ms",
  },
  CLS: {
    label: "Cumulative Layout Shift",
    unit: "",
    blurb: "Unexpected layout movement during the page's lifetime.",
    thresholds: "good ≤ 0.1 · needs improvement ≤ 0.25 · poor > 0.25",
  },
};

const RATING_VARIANT: Record<
  StoredVital["rating"],
  "default" | "secondary" | "outline"
> = {
  good: "default",
  "needs-improvement": "secondary",
  poor: "outline",
};

function formatValue(vital: StoredVital): string {
  const meta = METRIC_META[vital.name];
  if (vital.name === "CLS") return vital.value.toFixed(3);
  return `${Math.round(vital.value)}${meta.unit}`;
}

function useVitals(): StoredVital[] {
  return useSyncExternalStore(subscribeVitals, getVitals, () => []);
}

export default function VitalsRoute() {
  const { t } = useI18n();
  const vitals = useVitals();
  const byName = new Map(vitals.map((v) => [v.name, v]));
  const metricNames = Object.keys(METRIC_META) as WebVitalName[];

  return (
    <Container className="py-10">
      <div className="mb-6 flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Web Vitals</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Browser-session metrics only (LCP / INP / CLS). Public DTO — no
          internal collector, DSN, or probe endpoints are exposed on this page.
          See <code>web-vitals-reporter.ts</code>. No backend analytics
          required.
        </p>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Live LCP / INP / CLS reported by this browser tab, mirrored into an
          in-memory + <code>sessionStorage</code> store fed by{" "}
          <code>web-vitals-reporter.ts</code>. No backend or analytics endpoint
          required — this works fully offline (T-2026-115).
        </p>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Baseline load-time measurements (long tasks, heap) for the catalog
          dictionary are captured separately at{" "}
          <code>docs/perf/catalog-dictionary-measured.json</code>. See{" "}
          <code>docs/perf/vitals-panel.md</code> for how to see aggregate P75 in
          PostHog.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {metricNames.map((name) => {
          const vital = byName.get(name);
          // eslint-disable-next-line security/detect-object-injection -- name is typed WebVitalName
          const meta = METRIC_META[name];
          return (
            <Card key={name}>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle>{name}</CardTitle>
                  {vital ? (
                    <Badge variant={RATING_VARIANT[vital.rating]}>
                      {vital.rating}
                    </Badge>
                  ) : (
                    <Badge variant="outline">waiting…</Badge>
                  )}
                </div>
                <CardDescription>{meta.label}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <div className="text-3xl font-semibold tabular-nums">
                  {vital ? formatValue(vital) : "—"}
                </div>
                <p className="text-xs text-muted-foreground">{meta.blurb}</p>
                <p className="text-xs text-muted-foreground">
                  {meta.thresholds}
                </p>
                {vital ? (
                  <p className="text-xs text-muted-foreground">
                    route <code>{vital.route}</code> · captured{" "}
                    {new Date(vital.at).toLocaleTimeString()}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Navigate the app (and for INP, interact with it) to populate
                    this metric, then revisit this page.
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-6 flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => clearVitals()}
        >
          {t("vitals.clear")}
        </Button>
        <p className="text-xs text-muted-foreground">
          Metrics persist for this browser tab only (<code>sessionStorage</code>
          ); closing the tab clears them.
        </p>
      </div>
    </Container>
  );
}
