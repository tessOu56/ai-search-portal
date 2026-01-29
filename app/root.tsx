import "./tailwind.css";

import { readFileSync } from "node:fs";
import path from "node:path";

import type { LinksFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteError,
  useRouteLoaderData,
} from "@remix-run/react";

import { ErrorBoundaryFallback } from "~/components/errorboundary";
import { getLocale, getTranslations, type Locale } from "~/shared/i18n";
import { I18nProvider } from "~/shared/i18n/context";

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap",
  },
];

export async function loader({ request }: LoaderFunctionArgs) {
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
    // ignore
  }
  return json({ locale, translations, version });
}

type RootData = {
  locale: Locale;
  translations: Record<string, string>;
  version: string;
};

export function Layout({ children }: { children: React.ReactNode }) {
  const data = useRouteLoaderData("root") as RootData | undefined;
  const locale = data?.locale ?? "zh-TW";

  return (
    <html lang={locale === "en" ? "en" : "zh-TW"}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="bg-background font-sans antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {locale === "en" ? "Skip to main content" : "跳至主內容"}
        </a>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const data = useRouteLoaderData("root") as RootData | undefined;
  if (!data) {
    return <Outlet />;
  }
  return (
    <I18nProvider locale={data.locale} translations={data.translations}>
      <main id="main-content">
        <Outlet />
      </main>
    </I18nProvider>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    const title =
      error.status === 404 ? "找不到頁面" : `發生錯誤 (${error.status})`;
    const dataMessage =
      error.data &&
      typeof (error.data as { message?: unknown }).message === "string"
        ? (error.data as { message: string }).message
        : null;
    const message =
      error.status === 404
        ? "您要前往的頁面不存在，請檢查網址或返回首頁。"
        : (dataMessage ?? error.statusText ?? "請稍後再試。");
    return (
      <ErrorBoundaryFallback
        title={title}
        message={message}
        statusCode={error.status}
      />
    );
  }

  const message =
    error instanceof Error ? error.message : "發生未預期的錯誤，請稍後再試。";
  return <ErrorBoundaryFallback title="出了點問題" message={message} />;
}
