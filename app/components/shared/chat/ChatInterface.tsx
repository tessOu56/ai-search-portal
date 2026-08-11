import { inferIndustryFacetsFromText } from "@ai-search-portal/contracts";
import { Link } from "@remix-run/react";
import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import { AiFallbackPanel } from "~/components/shared/chat/AiFallbackPanel";
import { ChatBubble } from "~/components/shared/lui/ChatBubble";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/Alert";
import { Badge } from "~/components/ui/Badge";
import { Button } from "~/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import { ScrollArea } from "~/components/ui/ScrollArea";
import { Textarea } from "~/components/ui/Textarea";
import { apiChatQuery } from "~/shared/api/paths";
import {
  stableChatErrorSchema,
  stableChatFinalSchema,
  stableChatMetaSchema,
} from "~/shared/contracts";
import { useI18n } from "~/shared/i18n/context";
import {
  buildCatalogSearchUrl,
  buildMetadataSearchUrl,
} from "~/shared/navigation";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type LuiMeta = {
  summary?: string;
  confidence?: number;
  sources?: Array<{ title: string; url: string; source?: string }>;
  nextSteps?: string[];
};

const CHIP_CLASS =
  "inline-flex h-8 items-center rounded-full border border-border bg-background px-3 text-xs font-medium";

function parseStableMeta(data: string) {
  const parsed = stableChatMetaSchema.safeParse(JSON.parse(data) as unknown);
  if (!parsed.success) return null;
  return {
    summary: parsed.data.summary,
    confidence: parsed.data.confidence,
  };
}

function parseStableFinal(data: string) {
  const parsed = stableChatFinalSchema.safeParse(JSON.parse(data) as unknown);
  if (!parsed.success) return null;
  return {
    sources: parsed.data.sources,
    nextSteps: parsed.data.nextSteps,
  };
}

function parseStableFailure(data: string) {
  const parsed = stableChatErrorSchema.safeParse(JSON.parse(data) as unknown);
  return parsed.success ? parsed.data.message : null;
}

const KEY_SUMMARY_WAITING = "chat.summary.waiting";
const KEY_CHAT_ERROR_PARSE = "chat.error.parse";
const KEY_SOURCES_TITLE = "chat.sources.title";
const SOURCE_LINK_CLASS =
  "flex items-center gap-2 text-primary hover:underline";

type ChatInterfaceProps = {
  pendingQuery?: string | null;
  onPendingQueryConsumed?: () => void;
};

export function ChatInterface({
  pendingQuery = null,
  onPendingQueryConsumed,
}: ChatInterfaceProps) {
  const { t } = useI18n();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [meta, setMeta] = useState<LuiMeta>({});
  const [error, setError] = useState<string | null>(null);
  const [lastQuery, setLastQuery] = useState("");
  const lastAssistantId = useRef<string | null>(null);
  const streamRef = useRef<EventSource | null>(null);
  const submitQueryRef = useRef<(raw: string) => void>(() => undefined);

  useEffect(() => {
    return () => {
      streamRef.current?.close();
    };
  }, []);

  const submitQuery = (raw: string) => {
    const query = raw.trim();
    if (!query || isStreaming) return;

    setError(null);
    setLastQuery(query);
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: query,
    };
    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
    };
    lastAssistantId.current = assistantMessage.id;
    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setInput("");
    setMeta({});
    setIsStreaming(true);

    const stream = new EventSource(apiChatQuery(query));
    streamRef.current = stream;

    stream.addEventListener("meta", (event) => {
      try {
        const messageEvent = event as MessageEvent<string>;
        const data = parseStableMeta(messageEvent.data);
        if (!data) return;
        setMeta((prev) => ({
          ...prev,
          summary: data.summary ?? prev.summary,
          confidence: data.confidence ?? prev.confidence,
        }));
      } catch {
        setError(t(KEY_CHAT_ERROR_PARSE));
      }
    });

    stream.addEventListener("token", (event) => {
      const messageEvent = event as MessageEvent<string>;
      const token = messageEvent.data;
      setMessages((prev) =>
        prev.map((message) => {
          if (message.id !== lastAssistantId.current) return message;
          const suffix = message.content ? " " : "";
          return {
            ...message,
            content: `${message.content}${suffix}${token}`,
          };
        })
      );
    });

    stream.addEventListener("final", (event) => {
      try {
        const messageEvent = event as MessageEvent<string>;
        const data = parseStableFinal(messageEvent.data);
        if (!data) return;
        setMeta((prev) => ({
          ...prev,
          sources: data.sources ?? prev.sources,
          nextSteps: data.nextSteps ?? prev.nextSteps,
        }));
      } catch {
        setError(t(KEY_CHAT_ERROR_PARSE));
      }
    });

    stream.addEventListener("failure", (event) => {
      try {
        const messageEvent = event as MessageEvent<string>;
        const message = parseStableFailure(messageEvent.data);
        setError(message ?? t(KEY_CHAT_ERROR_PARSE));
      } catch {
        setError(t(KEY_CHAT_ERROR_PARSE));
      }
      setIsStreaming(false);
      stream.close();
    });

    stream.addEventListener("done", () => {
      setIsStreaming(false);
      stream.close();
    });

    stream.onerror = () => {
      setIsStreaming(false);
      setError(t("chat.error.connection"));
      stream.close();
    };
  };

  submitQueryRef.current = submitQuery;

  useEffect(() => {
    if (!pendingQuery?.trim()) return;
    submitQueryRef.current(pendingQuery);
    onPendingQueryConsumed?.();
  }, [pendingQuery, onPendingQueryConsumed]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    submitQuery(input);
  };

  const goldenQuestions = [
    t("chat.golden.q1"),
    t("chat.golden.q2"),
    t("chat.golden.q3"),
  ];

  const liveAnnouncement = (() => {
    const last = messages[messages.length - 1];
    if (!last || last.role !== "assistant") return "";
    if (isStreaming && last.content) return last.content.slice(-120);
    if (!isStreaming && last.content) return last.content;
    return isStreaming ? t(KEY_SUMMARY_WAITING) : "";
  })();

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{t("chat.badge.live")}</Badge>
            <Badge variant="secondary">{t("chat.badge.sse")}</Badge>
            <Badge variant="outline">{t("chat.badge.mock")}</Badge>
          </div>
          <CardTitle>{t("chat.title")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              {t("chat.golden.label")}
            </span>
            {goldenQuestions.map((question) => (
              <button
                key={question}
                type="button"
                disabled={isStreaming}
                onClick={() => submitQuery(question)}
                className={`${CHIP_CLASS} hover:bg-muted disabled:opacity-50`}
                data-testid="golden-question"
              >
                {question}
              </button>
            ))}
          </div>
          <form onSubmit={handleSubmit} className="grid gap-3">
            <Textarea
              value={input}
              onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                setInput(event.target.value)
              }
              placeholder={t("chat.placeholder")}
              disabled={isStreaming}
              aria-label={t("chat.placeholder")}
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-muted-foreground">
                {t("chat.hint")}
              </div>
              <Button
                type="submit"
                size="lg"
                variant="lui"
                disabled={isStreaming || !input.trim()}
                aria-busy={isStreaming}
              >
                {isStreaming ? t("chat.submitting") : t("chat.submit")}
              </Button>
            </div>
          </form>

          {error && (
            <>
              <Alert className="border-destructive/20 bg-destructive/5 text-destructive">
                <AlertTitle>{t("chat.error.title")}</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              <AiFallbackPanel query={lastQuery} />
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle id="chat-history-heading">
            {t("chat.history.title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="sr-only" aria-live="polite" aria-atomic="false">
            {liveAnnouncement}
          </div>
          <ScrollArea className="h-[320px] rounded-2xl border border-border px-4 py-3">
            <div
              className="space-y-4"
              role="log"
              aria-relevant="additions"
              aria-labelledby="chat-history-heading"
            >
              {messages.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  {t("chat.history.empty")}
                </p>
              )}
              {messages.map((message) => (
                <ChatBubble
                  key={message.id}
                  variant={message.role === "user" ? "user" : "assistant"}
                >
                  {message.content ||
                    (message.role === "assistant" ? "..." : "")}
                </ChatBubble>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("chat.summary.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>{meta.summary ?? t(KEY_SUMMARY_WAITING)}</p>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{t("chat.confidence")}</Badge>
              <span>
                {meta.confidence !== undefined
                  ? `${Math.round(meta.confidence * 100)}%`
                  : "—"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("chat.next.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            {(meta.nextSteps ?? []).length === 0 && (
              <p>{t(KEY_SUMMARY_WAITING)}</p>
            )}
            {(meta.nextSteps ?? []).map((step) => (
              <div key={step} className="flex items-start gap-2">
                <span className="mt-1 size-2 rounded-full bg-primary" />
                <p>{step}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t(KEY_SOURCES_TITLE)}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          {(meta.sources ?? []).length === 0 && <p>{t(KEY_SUMMARY_WAITING)}</p>}
          {(meta.sources ?? []).map((source) => {
            const internal = source.url.startsWith("/");
            return (
              <div key={source.url} className="space-y-0.5">
                {internal ? (
                  <Link
                    to={source.url}
                    className={SOURCE_LINK_CLASS}
                    aria-label={`${source.title} (${t(KEY_SOURCES_TITLE)})`}
                  >
                    {source.title}
                  </Link>
                ) : (
                  <a
                    href={source.url}
                    className={SOURCE_LINK_CLASS}
                    rel="noreferrer"
                    target="_blank"
                    aria-label={`${source.title} (${t(KEY_SOURCES_TITLE)})`}
                  >
                    {source.title}
                  </a>
                )}
                {source.source && (
                  <p className="text-muted-foreground/80 pl-6 text-xs">
                    {source.source}
                  </p>
                )}
              </div>
            );
          })}
          {!isStreaming && !error && lastQuery.trim() ? (
            <div
              className="flex flex-wrap gap-2 border-t border-border pt-3"
              data-testid="chat-continue-facets"
            >
              {(() => {
                const inferred = inferIndustryFacetsFromText(lastQuery);
                const facetLabel = [
                  inferred.standard,
                  inferred.productType,
                  inferred.auctionEligible ? "auction" : undefined,
                ]
                  .filter(Boolean)
                  .join(" · ");
                return (
                  <>
                    <Link
                      to={buildCatalogSearchUrl({
                        q: lastQuery,
                        material: inferred.material,
                        standard: inferred.standard,
                        productType: inferred.productType,
                        auctionEligible: inferred.auctionEligible,
                        intent: "manual",
                      })}
                      className={`${CHIP_CLASS} text-foreground hover:bg-muted`}
                      data-testid="chat-continue-catalog"
                    >
                      {t("chat.continue.catalog")}
                      {facetLabel ? ` · ${facetLabel}` : ""}
                    </Link>
                    <Link
                      to={buildMetadataSearchUrl({
                        q: lastQuery,
                        material: inferred.material,
                        standard: inferred.standard,
                        productType: inferred.productType,
                        auctionEligible: inferred.auctionEligible,
                        intent: "manual",
                      })}
                      className={`${CHIP_CLASS} text-foreground hover:bg-muted`}
                      data-testid="chat-continue-metadata"
                    >
                      {t("chat.continue.metadata")}
                    </Link>
                  </>
                );
              })()}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
