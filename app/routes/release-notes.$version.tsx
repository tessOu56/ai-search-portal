import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";

import { ProductPageHeader } from "~/components/shared/product/ProductPageShell";
import { EmptyState } from "~/components/ui/EmptyState";
import { Panel } from "~/components/ui/Panel";
import { Stack } from "~/components/ui/Stack";
import { getLocale, getTranslations } from "~/shared/i18n";
import { useI18n } from "~/shared/i18n/context";
import { t } from "~/shared/i18n/server";
import {
  getReleaseNoteByVersion,
  getReleaseNotes,
} from "~/shared/release-notes.server";
import {
  buildJsonLdArticle,
  buildJsonLdBreadcrumbList,
  buildSeoMeta,
  getCanonicalUrl,
  getOrigin,
  getSeoFromLoader,
} from "~/shared/seo";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const version = params.version ?? "";
  const note = getReleaseNoteByVersion(version);
  const locale = await getLocale(request);
  const translations = getTranslations(locale);
  const origin = getOrigin(request);
  const canonical = getCanonicalUrl(request, `/release-notes/${version}`);
  const ogLocale = locale.replace("-", "_");
  const pageTitle = t(translations, "release-notes.page.title");

  if (!note) {
    return {
      note: null,
      title: t(translations, "release-notes.notFound"),
      description: "",
      allVersions: getReleaseNotes().map((r) => r.version),
      canonical,
      locale: ogLocale,
      structuredData: [] as Record<string, unknown>[],
    };
  }

  const title = `v${note.version} - ${pageTitle}`;
  /** JSON-LD 結構化資料，供 meta 使用 */
  const structuredData = [
    buildJsonLdArticle(canonical, title, note.summary, note.date, {
      inLanguage: locale,
    }),
    buildJsonLdBreadcrumbList(origin, [
      { name: t(translations, "app.title"), path: "/" },
      { name: pageTitle, path: "/release-notes" },
      { name: `v${note.version}`, path: `/release-notes/${note.version}` },
    ]),
  ];
  return {
    note,
    title,
    allVersions: getReleaseNotes().map((r) => r.version),
    description: note.summary,
    canonical,
    locale: ogLocale,
    structuredData,
  };
};

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const seo = getSeoFromLoader(data, { title: "版本說明" });
  const metaTags = buildSeoMeta({
    title: seo.title,
    description: seo.description || seo.title,
    canonical: seo.canonical,
    locale: seo.locale,
    type: "article",
  });
  const jsonLdTags = seo.structuredData.map((obj) => ({
    "script:ld+json": obj,
  }));
  return [...metaTags, ...jsonLdTags];
};

export default function ReleaseNoteVersion() {
  const { t } = useI18n();
  const data = useLoaderData<typeof loader>();
  const { note } = data;

  if (!note) {
    return (
      <Stack gap="md">
        <EmptyState title={t("release-notes.notFound")} />
        <Link to="/release-notes" className="text-primary hover:underline">
          {t("release-notes.back")}
        </Link>
      </Stack>
    );
  }

  return (
    <Panel>
      <article>
        <header className="mb-6">
          <Link
            to="/release-notes"
            className="text-sm text-muted-foreground hover:text-foreground hover:underline"
          >
            ← {t("release-notes.back")}
          </Link>
          <ProductPageHeader
            title={`v${note.version}`}
            description={
              <time dateTime={note.date}>
                {t("release-notes.date")}: {note.date}
              </time>
            }
          />
        </header>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">
            {t("release-notes.summary")}
          </h2>
          <p className="text-muted-foreground">{note.summary}</p>
        </section>

        {note.highlights.length > 0 && (
          <section className="mt-6 space-y-2">
            <h2 className="text-lg font-semibold text-foreground">
              {t("release-notes.highlights")}
            </h2>
            <ul className="list-inside list-disc space-y-1 text-muted-foreground">
              {note.highlights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        )}

        {note.commits.length > 0 && (
          <section className="mt-6 space-y-2">
            <h2 className="text-lg font-semibold text-foreground">
              {t("release-notes.commits")}
            </h2>
            <ul className="space-y-1 font-mono text-sm text-muted-foreground">
              {note.commits.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </section>
        )}
      </article>
    </Panel>
  );
}
