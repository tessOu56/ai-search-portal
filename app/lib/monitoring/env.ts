type ClientSentryEnv = {
  VITE_SENTRY_DSN?: string;
  VITE_SENTRY_TRACES_SAMPLE_RATE?: string;
  MODE?: string;
};

function processEnv(
  name: "VITE_SENTRY_DSN" | "VITE_SENTRY_TRACES_SAMPLE_RATE"
): string | undefined {
  if (typeof process === "undefined") return undefined;
  if (name === "VITE_SENTRY_DSN") return process.env.VITE_SENTRY_DSN;
  return process.env.VITE_SENTRY_TRACES_SAMPLE_RATE;
}

function clientEnv(): ClientSentryEnv {
  const meta = import.meta as ImportMeta & { env?: ClientSentryEnv };
  const fromMeta = meta.env ?? {};
  return {
    VITE_SENTRY_DSN: fromMeta.VITE_SENTRY_DSN ?? processEnv("VITE_SENTRY_DSN"),
    VITE_SENTRY_TRACES_SAMPLE_RATE:
      fromMeta.VITE_SENTRY_TRACES_SAMPLE_RATE ??
      processEnv("VITE_SENTRY_TRACES_SAMPLE_RATE"),
    MODE: fromMeta.MODE,
  };
}

export function readClientSentryDsn(): string | undefined {
  const dsn = clientEnv().VITE_SENTRY_DSN?.trim();
  return dsn && dsn.length > 0 ? dsn : undefined;
}

export function readServerSentryDsn(): string | undefined {
  const dsn = process.env.SENTRY_DSN?.trim();
  return dsn && dsn.length > 0 ? dsn : undefined;
}

export function readTracesSampleRate(raw: string | undefined): number {
  if (!raw) return 0.1;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) return 0.1;
  return Math.min(parsed, 1);
}

export function readClientTracesSampleRate(): number {
  return readTracesSampleRate(clientEnv().VITE_SENTRY_TRACES_SAMPLE_RATE);
}

export function readServerTracesSampleRate(): number {
  return readTracesSampleRate(process.env.SENTRY_TRACES_SAMPLE_RATE);
}

export function sentryUploadEnabled(): boolean {
  return Boolean(
    process.env.SENTRY_AUTH_TOKEN &&
    process.env.SENTRY_ORG &&
    process.env.SENTRY_PROJECT
  );
}
