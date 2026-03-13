import type { ReactNode } from "react";

import { Button } from "~/components/ui/Button";
import { Container } from "~/components/ui/Container";

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
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 via-background to-brand-50 p-4">
      <Container className="text-center">
        {statusCode != null && (
          <p className="mb-2 text-sm font-medium text-muted-foreground">
            {statusCode}
          </p>
        )}
        <h1 className="mb-3 text-2xl font-bold text-foreground sm:text-3xl">
          {title}
        </h1>
        <p className="mx-auto mb-8 max-w-md text-muted-foreground">{message}</p>
        {children ?? (
          <div className="flex flex-wrap justify-center gap-3">
            <Button variant="default" onClick={() => window.location.reload()}>
              重新整理
            </Button>
            <Button variant="outline" onClick={() => window.history.back()}>
              返回上一頁
            </Button>
          </div>
        )}
      </Container>
    </div>
  );
}
