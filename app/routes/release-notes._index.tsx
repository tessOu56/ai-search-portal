import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { Link, useLoaderData, useRouteLoaderData } from "@remix-run/react";

import { getLocale, getTranslations } from "~/shared/i18n";
import { useI18n } from "~/shared/i18n/context";
import { t } from "~/shared/i18n/server";
import { getReleaseNotes } from "~/shared/release-notes.server";
import {
  buildJsonLdBreadcrumbList,
  buildJsonLdWebPage,
  buildSeoMeta,
  getCanonicalUrl,
  getOrigin,
} from "~/shared/seo.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const locale = await getLocale(request);
  const translations = getTranslations(locale);
  const notes = getReleaseNotes();
  const origin = getOrigin(request);
  const canonical = getCanonicalUrl(request);
  const title = t(translations, "release-notes.page.title");
  const description = t(translations, "release-notes.page.description");
  const ogLocale = locale.replace("-", "_");
  const structuredData = [
    buildJsonLdWebPage(canonical, title, description, { inLanguage: locale }),
    buildJsonLdBreadcrumbList(origin, [
      { name: t(translations, "app.title"), path: "/" },
      { name: title, path: "/release-notes" },
    ]),
  ];
  return {
    title,
    description,
    notes,
    canonical,
    locale: ogLocale,
    structuredData,
  };
};

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const title = (data?.title as string) ?? "版本說明";
  const description = (data?.description as string) ?? "各版本更新摘要。";
  const canonical = (data?.canonical as string) ?? "";
  const locale = (data?.locale as string) ?? "zh_TW";
  const structuredData =
    (data?.structuredData as Record<string, unknown>[]) ?? [];
  const metaTags = buildSeoMeta({
    title,
    description,
    canonical,
    locale,
    type: "website",
  });
  const jsonLdTags = structuredData.map((obj) => ({ "script:ld+json": obj }));
  return [...metaTags, ...jsonLdTags];
};

export default function ReleaseNotesIndex() {
  const { t } = useI18n();
  const data = useLoaderData<typeof loader>();
  const root = useRouteLoaderData("root") as { version?: string } | undefined;
  const currentVersion = root?.version ?? "0.0.0";
  const { notes } = data;

  return (
    <>
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-foreground">
          {t("release-notes.page.title")}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {t("release-notes.page.description")}
        </p>
      </header>

      <section aria-labelledby="release-notes-list-heading">
        <h2 id="release-notes-list-heading" className="sr-only">
          {t("release-notes.list.title")}
        </h2>
        <ul className="space-y-6">
          {notes.map((note) => (
            <li key={note.version}>
              <article
                id={`v${note.version}`}
                className="rounded-lg border border-border bg-card p-6 shadow-sm"
              >
                <div className="mb-3 flex flex-wrap items-center gap-3">
                  <Link
                    to={`/release-notes/${note.version}`}
                    className="text-xl font-semibold text-primary hover:underline"
                  >
                    v{note.version}
                  </Link>
                  {note.version === currentVersion && (
                    <span className="rounded bg-primary/10 px-2 py-0.5 text-sm text-primary">
                      Current
                    </span>
                  )}
                  <time
                    dateTime={note.date}
                    className="text-sm text-muted-foreground"
                  >
                    {note.date}
                  </time>
                </div>
                <p className="text-muted-foreground">{note.summary}</p>
                <Link
                  to={`/release-notes/${note.version}`}
                  className="mt-3 inline-block text-sm text-primary hover:underline"
                >
                  {t("release-notes.summary")} →
                </Link>
              </article>
            </li>
          ))}
        </ul>
      </section>

      {notes.length === 0 && (
        <p className="text-muted-foreground">{t("release-notes.notFound")}</p>
      )}
    </>
  );
}
