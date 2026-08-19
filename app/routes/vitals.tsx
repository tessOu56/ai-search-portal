import type { WebVitalName } from "@ai-search-portal/contracts";
import type { MetaFunction } from "@remix-run/node";
import { useSyncExternalStore } from "react";

import {
  ProductPageHeader,
  ProductPageShell,
} from "~/components/shared/product/ProductPageShell";
import { Button } from "~/components/ui/Button";
import { Grid } from "~/components/ui/Grid";
import { Metric } from "~/components/ui/Metric";
import { StatusChip } from "~/components/ui/StatusChip";
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

function ratingStatus(
  rating: StoredVital["rating"] | undefined
): "success" | "warning" | "danger" | "neutral" {
  if (rating === "good") return "success";
  if (rating === "needs-improvement") return "warning";
  if (rating === "poor") return "danger";
  return "neutral";
}

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
    <ProductPageShell current="Web Vitals">
      <ProductPageHeader
        title="Web Vitals"
        description="Browser-session metrics only (LCP / INP / CLS). Navigate the app, then return here. Values stay in this tab’s session storage."
      />

      <Grid columns={3} gap="md">
        {metricNames.map((name) => {
          const vital = byName.get(name);
          // eslint-disable-next-line security/detect-object-injection -- name is typed WebVitalName
          const meta = METRIC_META[name];
          return (
            <Metric
              key={name}
              label={
                <span className="flex items-center justify-between gap-2">
                  <span>{name}</span>
                  <StatusChip status={ratingStatus(vital?.rating)}>
                    {vital ? vital.rating : "waiting"}
                  </StatusChip>
                </span>
              }
              value={vital ? formatValue(vital) : "—"}
              description={`${meta.label}. ${meta.blurb} ${meta.thresholds}${
                vital
                  ? ` · route ${vital.route} · ${new Date(vital.at).toLocaleTimeString()}`
                  : " · Interact with the app to populate this metric."
              }`}
            />
          );
        })}
      </Grid>

      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => clearVitals()}
        >
          {t("vitals.clear")}
        </Button>
        <p className="text-type-14 text-muted-foreground">
          Metrics persist for this browser tab only.
        </p>
      </div>
    </ProductPageShell>
  );
}
