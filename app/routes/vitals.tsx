import type { WebVitalName } from "@ai-search-portal/contracts";
import type { MetaFunction } from "@remix-run/node";
import { useEffect, useState } from "react";

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
} from "~/lib/analytics/vitals-store";
import { useI18n } from "~/shared/i18n/context";

export const meta: MetaFunction = () => [
  { title: "Web Vitals | Portal" },
  {
    name: "description",
    content:
      "Live LCP / INP / CLS captured from this browser session — no backend required.",
  },
];

const METRIC_META: Record<
  WebVitalName,
  { label: string; unit: string; blurb: string }
> = {
  LCP: {
    label: "Largest Contentful Paint",
    unit: "ms",
    blurb: "Time until the largest visible element finishes rendering.",
  },
  INP: {
    label: "Interaction to Next Paint",
    unit: "ms",
    blurb: "Responsiveness of the page to user interactions.",
  },
  CLS: {
    label: "Cumulative Layout Shift",
    unit: "",
    blurb: "Unexpected layout movement during the page's lifetime.",
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

export default function VitalsRoute() {
  const { t } = useI18n();
  const [vitals, setVitals] = useState<StoredVital[]>([]);

  useEffect(() => {
    setVitals(getVitals());
  }, []);

  const byName = new Map(vitals.map((v) => [v.name, v]));
  const metricNames = Object.keys(METRIC_META) as WebVitalName[];

  return (
    <ProductPageShell current={t("nav.vitals")}>
      <ProductPageHeader
        title={t("nav.vitals")}
        description="Snapshot of LCP / INP / CLS from this tab. Navigate the app, then refresh."
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
              description={meta.blurb}
            />
          );
        })}
      </Grid>

      <div className="flex items-center gap-3">
        <Button type="button" size="sm" onClick={() => setVitals(getVitals())}>
          Refresh
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            clearVitals();
            setVitals([]);
          }}
        >
          {t("vitals.clear")}
        </Button>
      </div>
    </ProductPageShell>
  );
}
