import "./tailwind.css";

import { readFileSync } from "node:fs";
import path from "node:path";

import type { LinksFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteError,
  useRouteLoaderData,
} from "@remix-run/react";

import { ErrorBoundaryFallback } from "~/components/app/errorboundary";
import { ThemeSwitcher } from "~/components/theme/ThemeSwitcher";
import { ensureSeeded } from "~/services/seed.server";
import { getLocale, getTranslations, type Locale } from "~/shared/i18n";
import { I18nProvider } from "~/shared/i18n/context";
import { getRouteErrorDisplay } from "~/shared/utils/errors";

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    // 和紙編輯風 display font（Petrona 拉丁 / Shippori Mincho 漢字）+ body Inter
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Petrona:wght@400;500;600&family=Shippori+Mincho:wght@400;500;600&display=swap",
  },
];

export async function loader({ request }: LoaderFunctionArgs) {
  await ensureSeeded();
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

  // data-app：掛載 @explore-design/tokens 的 application scope（見 app/styles/tokens.portal.css）
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
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {locale === "en" ? "Skip to main content" : "跳至主內容"}
        </a>
        {children}
        <ThemeSwitcher />
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
  const { title, message, statusCode } = getRouteErrorDisplay(error);
  return (
    <ErrorBoundaryFallback
      title={title}
      message={message}
      statusCode={statusCode}
    />
  );
}
