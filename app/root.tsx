import "./tailwind.css";

import { readFileSync } from "node:fs";
import path from "node:path";

import { type ReactNode, useEffect } from "react";
import type { LinksFunction, LoaderFunctionArgs } from "react-router";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteError,
  useRouteLoaderData,
} from "react-router";

import { ErrorBoundaryFallback } from "~/components/app/errorboundary";
import { AppChrome } from "~/components/app/workspace/AppChrome";
import { DeferredChrome } from "~/components/shared/chrome/DeferredChrome";
import { getLocale, getTranslations, type Locale } from "~/shared/i18n";
import { I18nProvider } from "~/shared/i18n/context";
import { getRouteErrorDisplay } from "~/shared/utils/errors";

export const links: LinksFunction = () => [
  { rel: "icon", href: "/favicon.ico", sizes: "any" },
  { rel: "icon", href: "/favicon-32.png", type: "image/png", sizes: "32x32" },
  { rel: "icon", href: "/favicon-16.png", type: "image/png", sizes: "16x16" },
  { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
  { rel: "apple-touch-icon", href: "/apple-touch-icon.svg" },
];

export async function loader({ request }: LoaderFunctionArgs) {
  // Seed 不阻塞 document shell：冷啟動／無快取時先噴畫布，資料由路由級 ensureSeeded 補齊
  const locale = await getLocale(request);
  const translations = getTranslations(locale);
  let version = "0.0.0";
  try {
    const pkgPath = path.join(process.cwd(), "package.json");
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8")) as Record<
      string,
      unknown
    >;
    version = typeof pkg.version === "string" ? pkg.version : version;
  } catch {
    // package.json 讀取失敗時使用預設版號，不中斷啟動
  }
  return { locale, translations, version };
}

type RootData = {
  locale: Locale;
  translations: Record<string, string>;
  version: string;
};

export function Layout({ children }: { children: ReactNode }) {
  const data = useRouteLoaderData("root") as RootData | undefined;
  const locale = data?.locale ?? "zh-TW";

  // data-app：掛載 @is_tess/tokens 的 application scope（見 app/styles/tokens.portal.css）
  // data-theme：SSR 預設若草（PALETTE v5）；init script 依 localStorage 覆寫，蜜蝋＝移除 attr 回 [data-app] 基底
  return (
    <html
      lang={locale === "en" ? "en" : "zh-TW"}
      data-app="portal"
      data-theme="wakakusa"
    >
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* 主題 init（防 FOUC）：讀 localStorage 還原 data-theme 與 .dark，值域見 ThemeSwitcher */}
        <script
          // Static theme bootstrap only; no user-controlled HTML.
          // eslint-disable-next-line react/no-danger -- FOUC theme init
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("portal-theme");if(t==="mitsurou"){delete document.documentElement.dataset.theme;}else if(t){document.documentElement.dataset.theme=t;}if(localStorage.getItem("portal-mode")==="dark")document.documentElement.classList.add("dark");}catch(e){}`,
          }}
        />
        <Meta />
        <Links />
      </head>
      <body className="bg-background font-sans antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {data?.translations?.["a11y.skipToContent"] ??
            (locale === "en" ? "Skip to main content" : "跳至主內容")}
        </a>
        {children}
        <DeferredChrome />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const data = useRouteLoaderData("root") as RootData | undefined;
  useEffect(() => {
    document.documentElement.dataset.hydrated = "true";
    let cancelled = false;
    let idleId: number | undefined;
    const startMonitoring = () => {
      void (async () => {
        const { startWebVitalsReporting } =
          await import("~/lib/analytics/web-vitals-reporter");
        if (cancelled) return;
        startWebVitalsReporting();
        const { readClientSentryDsn } = await import("~/lib/monitoring/env");
        if (cancelled || !readClientSentryDsn()) return;
        const { initSentryClient } =
          await import("~/lib/monitoring/sentry.client");
        if (!cancelled) initSentryClient();
      })();
    };
    const schedule = () => {
      if (cancelled) return;
      if (typeof requestIdleCallback === "function") {
        idleId = requestIdleCallback(startMonitoring, { timeout: 8_000 });
        return;
      }
      idleId = window.setTimeout(startMonitoring, 4_000);
    };
    if (document.readyState === "complete") {
      schedule();
    } else {
      window.addEventListener("load", schedule, { once: true });
    }
    return () => {
      cancelled = true;
      window.removeEventListener("load", schedule);
      if (idleId == null) return;
      if (typeof requestIdleCallback === "function") {
        cancelIdleCallback(idleId);
      } else {
        window.clearTimeout(idleId);
      }
    };
  }, []);
  if (!data) {
    return <Outlet />;
  }
  return (
    <I18nProvider locale={data.locale} translations={data.translations}>
      <AppChrome>
        <main
          id="main-content"
          tabIndex={-1}
          className="flex min-h-0 min-w-0 flex-1 flex-col outline-none"
        >
          <Outlet />
        </main>
      </AppChrome>
    </I18nProvider>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  const data = useRouteLoaderData("root") as RootData | undefined;
  const { title, message, statusCode } = getRouteErrorDisplay(
    error,
    data?.locale
  );
  return (
    <ErrorBoundaryFallback
      title={title}
      message={message}
      statusCode={statusCode}
    />
  );
}
