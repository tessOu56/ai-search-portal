type AnalyticsEnv = {
  VITE_ANALYTICS_ENABLED?: string;
  VITE_ANALYTICS_ENDPOINT?: string;
};

function processEnv(name: keyof AnalyticsEnv): string | undefined {
  if (typeof process === "undefined") return undefined;
  if (name === "VITE_ANALYTICS_ENABLED") {
    return process.env.VITE_ANALYTICS_ENABLED;
  }
  return process.env.VITE_ANALYTICS_ENDPOINT;
}

function readAnalyticsEnv(): AnalyticsEnv {
  const meta = import.meta as ImportMeta & { env?: AnalyticsEnv };
  const fromMeta = meta.env ?? {};
  return {
    VITE_ANALYTICS_ENABLED:
      fromMeta.VITE_ANALYTICS_ENABLED ?? processEnv("VITE_ANALYTICS_ENABLED"),
    VITE_ANALYTICS_ENDPOINT:
      fromMeta.VITE_ANALYTICS_ENDPOINT ?? processEnv("VITE_ANALYTICS_ENDPOINT"),
  };
}

export function isProductAnalyticsEnabled(): boolean {
  return readAnalyticsEnv().VITE_ANALYTICS_ENABLED === "1";
}

export function productAnalyticsEndpoint(): string | null {
  if (typeof window === "undefined" || !isProductAnalyticsEnabled()) {
    return null;
  }
  return readAnalyticsEnv().VITE_ANALYTICS_ENDPOINT ?? "http://localhost:19000";
}
