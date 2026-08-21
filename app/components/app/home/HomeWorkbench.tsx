import { Link } from "@remix-run/react";

import { useI18n } from "~/shared/i18n/context";

export type HomeWorkbenchAsset = {
  id: string;
  name: string;
  href: string;
  classification?: string;
};

export type HomeWorkbenchProps = {
  pendingCount: number;
  suggestedAssets: HomeWorkbenchAsset[];
};

/**
 * Ask empty-state workbench: pending requests + suggested assets.
 * Editorial headline stays in HomeLanding; this is the job strip.
 */
export function HomeWorkbench({
  pendingCount,
  suggestedAssets,
}: HomeWorkbenchProps) {
  const { t } = useI18n();

  return (
    <aside
      className="border-border/80 bg-background/70 w-full max-w-xl rounded-2xl border p-space-16"
      data-testid="home-workbench"
      aria-label={t("home.workbench.title")}
    >
      <p className="mb-space-8 text-type-12 font-medium uppercase tracking-wide text-muted-foreground">
        {t("home.workbench.title")}
      </p>
      <p className="mb-space-8 text-type-14 text-foreground">
        {t("home.workbench.pending", { count: String(pendingCount) })}{" "}
        <Link
          to="/my-apis?sessionRole=requester"
          className="text-primary hover:underline"
        >
          {t("nav.my-requests")}
        </Link>
      </p>
      {suggestedAssets.length > 0 ? (
        <div>
          <p className="mb-space-8 text-type-12 text-muted-foreground">
            {t("home.workbench.suggested")}
          </p>
          <ul className="space-y-space-8">
            {suggestedAssets.map((asset) => (
              <li key={asset.id}>
                <Link
                  to={asset.href}
                  className="text-type-14 text-primary hover:underline"
                  data-testid="home-workbench-asset"
                >
                  {asset.name}
                </Link>
                {asset.classification ? (
                  <span className="ml-space-8 text-type-12 text-muted-foreground">
                    {asset.classification}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </aside>
  );
}
