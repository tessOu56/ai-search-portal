import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { Link, useRouteError, useSearchParams } from "@remix-run/react";
import { useCallback, useEffect, useState } from "react";

import { ErrorBoundaryFallback } from "~/components/app/errorboundary";
import { HomeIntro } from "~/components/app/home/HomeIntro";
import { HomeLanding } from "~/components/app/home/HomeLanding";
import {
  DashboardView,
  WorkspaceChatView,
  WorkspaceFooter,
} from "~/components/app/workspace";
import { Button } from "~/components/ui/Button";
import { ASK_HOME_RESET_EVENT } from "~/lib/workspace-mode";
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

function Atmosphere() {
  return (
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
}

export default function Index() {
  const [searchParams, setSearchParams] = useSearchParams();
  const viewParam = searchParams.get("view");
  const view =
    viewParam === "dashboard" || viewParam === "saas" ? "dashboard" : "chat";
  const askRaw = searchParams.get("q")?.trim();
  const askParam = askRaw && askRaw.length > 0 ? askRaw : null;
  const [conversationActive, setConversationActive] = useState(
    () => view === "chat" && Boolean(askParam)
  );
  const [pendingQuery, setPendingQuery] = useState<string | null>(() =>
    view === "chat" ? askParam : null
  );

  useEffect(() => {
    if (view !== "chat" || !askParam) return;
    setPendingQuery(askParam);
    setConversationActive(true);
  }, [askParam, view]);

  const onAsk = useCallback((query: string) => {
    setPendingQuery(query);
    setConversationActive(true);
  }, []);

  const onNewConversation = useCallback(() => {
    setConversationActive(false);
    setPendingQuery(null);
    if (searchParams.has("q") || searchParams.has("view")) {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete("q");
          next.delete("view");
          return next;
        },
        { replace: true }
      );
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const onReset = () => onNewConversation();
    window.addEventListener(ASK_HOME_RESET_EVENT, onReset);
    return () => window.removeEventListener(ASK_HOME_RESET_EVENT, onReset);
  }, [onNewConversation]);

  if (view === "dashboard") {
    return (
      <div className="relative flex min-h-0 flex-1 flex-col">
        <Atmosphere />
        <DashboardView />
      </div>
    );
  }

  if (!conversationActive) {
    return (
      <div className="relative">
        <Atmosphere />
        <HomeLanding onAsk={onAsk} />
        <HomeIntro />
        <WorkspaceFooter />
      </div>
    );
  }

  return (
    <div
      className="relative flex min-h-0 flex-1 flex-col"
      data-testid="conversation-shell"
    >
      <Atmosphere />
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
