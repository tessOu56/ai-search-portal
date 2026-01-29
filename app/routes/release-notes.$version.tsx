import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";

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
} from "~/shared/seo.server";

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
  const title = (data?.title as string) ?? "版本說明";
  const description = (data?.description as string) ?? "";
  const canonical = (data?.canonical as string) ?? "";
  const locale = (data?.locale as string) ?? "zh_TW";
  const structuredData =
    (data?.structuredData as Record<string, unknown>[]) ?? [];
  const metaTags = buildSeoMeta({
    title,
    description: description || title,
    canonical,
    locale,
    type: "article",
  });
  const jsonLdTags = structuredData.map((obj) => ({ "script:ld+json": obj }));
  return [...metaTags, ...jsonLdTags];
};

export default function ReleaseNoteVersion() {
  const { t } = useI18n();
  const data = useLoaderData<typeof loader>();
  const { note } = data;

  if (!note) {
    return (
      <>
        <p className="text-muted-foreground">{t("release-notes.notFound")}</p>
        <Link
          to="/release-notes"
          className="mt-4 inline-block text-primary hover:underline"
        >
          {t("release-notes.back")}
        </Link>
      </>
    );
  }

  return (
    <article className="rounded-lg border border-border bg-card p-6 shadow-sm">
      <header className="mb-6">
        <Link
          to="/release-notes"
          className="text-sm text-muted-foreground hover:text-foreground hover:underline"
        >
          ← {t("release-notes.back")}
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-foreground">
          v{note.version}
        </h1>
        <time
          dateTime={note.date}
          className="block text-sm text-muted-foreground"
        >
          {t("release-notes.date")}: {note.date}
        </time>
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
  );
}
