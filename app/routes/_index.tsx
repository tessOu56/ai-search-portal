import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { Link, useRouteError, useSearchParams } from "@remix-run/react";
import { useCallback, useState } from "react";

import { ErrorBoundaryFallback } from "~/components/app/errorboundary";
import { HomeIntro } from "~/components/app/home/HomeIntro";
import { HomeLanding } from "~/components/app/home/HomeLanding";
import {
  DashboardView,
  WorkspaceChatView,
  WorkspaceFooter,
  WorkspaceViewSwitcher,
} from "~/components/app/workspace";
import { Button } from "~/components/ui/Button";
import { getLocale, getTranslations } from "~/shared/i18n";
import { t } from "~/shared/i18n/server";
import {
  buildJsonLdWebPage,
  buildJsonLdWebSite,
  buildSeoMeta,
  getCanonicalUrl,
  getOrigin,
  getSeoFromLoader,
} from "~/shared/seo";
import { getRouteErrorDisplay } from "~/shared/utils/errors";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const locale = await getLocale(request);
  const translations = getTranslations(locale);
  const origin = getOrigin(request);
  const canonical = getCanonicalUrl(request);
  const title = t(translations, "app.title");
  const description = t(translations, "app.description");
  const ogLocale = locale.replace("-", "_");
  const image = `${origin}/og-image.png`;
  const structuredData = [
    buildJsonLdWebSite(origin, title, description),
    buildJsonLdWebPage(canonical, title, description, { inLanguage: locale }),
  ];
  return {
    title,
    description,
    canonical,
    image,
    locale: ogLocale,
    structuredData,
  };
};

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const seo = getSeoFromLoader(data);
  const metaTags = buildSeoMeta({
    title: seo.title,
    description: seo.description,
    canonical: seo.canonical,
    image: seo.image,
    locale: seo.locale,
    type: "website",
  });
  const jsonLdTags = seo.structuredData.map((obj) => ({
    "script:ld+json": obj,
  }));
  return [...metaTags, ...jsonLdTags];
};

export default function Index() {
  const [searchParams] = useSearchParams();
  const viewParam = searchParams.get("view");
  const view =
    viewParam === "dashboard" || viewParam === "saas" ? "dashboard" : "chat";
  const [conversationActive, setConversationActive] = useState(false);
  const [pendingQuery, setPendingQuery] = useState<string | null>(null);

  const onAsk = useCallback((query: string) => {
    setPendingQuery(query);
    setConversationActive(true);
  }, []);

  const onNewConversation = useCallback(() => {
    setConversationActive(false);
    setPendingQuery(null);
  }, []);

  if (view === "dashboard") {
    return (
      <div className="relative min-h-dvh bg-background">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20">
          <div className="pointer-events-auto mx-auto flex max-w-6xl items-center justify-end p-space-16 md:px-space-32">
            <WorkspaceViewSwitcher className="bg-background/70 backdrop-blur-md" />
          </div>
        </div>
        <DashboardView />
      </div>
    );
  }

  const atmosphere = (
    <div
      className="eds-atmosphere eds-atmosphere--home-span pointer-events-none absolute inset-x-0 top-0 -z-10"
      aria-hidden
    >
      <div className="eds-atmosphere-layer eds-atmosphere-layer--canvas" />
      <div className="eds-atmosphere-layer eds-atmosphere-layer--glow eds-atmosphere-layer--glow-soft" />
      <div className="eds-atmosphere-layer eds-atmosphere-layer--leak" />
      <div className="eds-atmosphere-layer eds-atmosphere-layer--veil" />
    </div>
  );

  if (!conversationActive) {
    return (
      <div className="relative">
        {atmosphere}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20">
          <div className="pointer-events-auto mx-auto flex max-w-6xl items-center justify-end p-space-16 md:px-space-32">
            <WorkspaceViewSwitcher className="bg-background/50 backdrop-blur-md" />
          </div>
        </div>
        <HomeLanding onAsk={onAsk} />
        <HomeIntro />
        <WorkspaceFooter />
      </div>
    );
  }

  return (
    <div className="relative">
      {atmosphere}
      <WorkspaceChatView
        pendingQuery={pendingQuery}
        onPendingQueryConsumed={() => setPendingQuery(null)}
        onNewConversation={onNewConversation}
      />
    </div>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  const { title, message, statusCode } = getRouteErrorDisplay(error);
  return (
    <ErrorBoundaryFallback
      title={title}
      message={message}
      statusCode={statusCode}
    >
      <Button asChild>
        <Link to="/">返回首頁</Link>
      </Button>
    </ErrorBoundaryFallback>
  );
}
