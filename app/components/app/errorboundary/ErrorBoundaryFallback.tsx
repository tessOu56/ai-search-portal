/**
 * 用於 route 與 root ErrorBoundary 的 fallback UI。
 */
import type { ReactNode } from "react";
import { Link, useRouteLoaderData } from "react-router";

import { Button } from "~/components/ui/Button";
import { Container } from "~/components/ui/Container";

type RootData = {
  translations?: Record<string, string>;
};

type ErrorBoundaryFallbackProps = {
  title: string;
  message: string;
  statusCode?: number;
  children?: ReactNode;
};

export function ErrorBoundaryFallback({
  title,
  message,
  statusCode,
  children,
}: ErrorBoundaryFallbackProps) {
  const data = useRouteLoaderData("root") as RootData | undefined;
  const t = (key: string, fallback: string) => {
    const translations = data?.translations;
    if (!translations) return fallback;
    const value = Object.hasOwn(translations, key)
      ? // eslint-disable-next-line security/detect-object-injection -- key is a fixed i18n catalog entry
        translations[key]
      : undefined;
    return value && value.length > 0 ? value : fallback;
  };

  return (
    <div
      className="flex min-h-[100dvh] items-center justify-center bg-background p-gutter"
      data-testid="route-error-shell"
      role="alert"
    >
      <Container className="text-center">
        {statusCode != null && (
          <p className="mb-space-8 text-type-14 font-medium text-muted-foreground">
            {statusCode}
          </p>
        )}
        <h1 className="mb-space-8 font-display text-type-32 font-medium text-foreground sm:text-type-52">
          {title}
        </h1>
        <p className="mx-auto mb-space-32 max-w-md text-muted-foreground">
          {message}
        </p>
        {children ?? (
          <div className="flex flex-wrap justify-center gap-stack-dense">
            <Button variant="default" onClick={() => window.location.reload()}>
              {t("error.reload", "Reload")}
            </Button>
            <Button asChild variant="outline">
              <Link to="/">{t("error.home", "Back to home")}</Link>
            </Button>
          </div>
        )}
      </Container>
    </div>
  );
}
