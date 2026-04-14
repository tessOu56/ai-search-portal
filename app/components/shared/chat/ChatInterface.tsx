import { useEffect, useRef, useState } from "react";

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

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type LuiMeta = {
  summary?: string;
  confidence?: number;
  sources?: Array<{ title: string; url: string }>;
  nextSteps?: string[];
};

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

export function ChatInterface() {
  const { t } = useI18n();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [meta, setMeta] = useState<LuiMeta>({});
  const [error, setError] = useState<string | null>(null);
  const lastAssistantId = useRef<string | null>(null);
  const streamRef = useRef<EventSource | null>(null);

  useEffect(() => {
    return () => {
      streamRef.current?.close();
    };
  }, []);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const query = input.trim();
    if (!query || isStreaming) return;

    setError(null);
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

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{t("chat.badge.live")}</Badge>
            <Badge variant="secondary">{t("chat.badge.sse")}</Badge>
          </div>
          <CardTitle>{t("chat.title")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form onSubmit={handleSubmit} className="grid gap-3">
            <Textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
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
            <Alert className="border-destructive/20 bg-destructive/5 text-destructive">
              <AlertTitle>{t("chat.error.title")}</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("chat.history.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[320px] rounded-2xl border border-border px-4 py-3">
            <div className="space-y-4">
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
          <CardTitle>{t("chat.sources.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          {(meta.sources ?? []).length === 0 && <p>{t(KEY_SUMMARY_WAITING)}</p>}
          {(meta.sources ?? []).map((source) => (
            <a
              key={source.url}
              href={source.url}
              className="flex items-center gap-2 text-primary hover:underline"
              rel="noreferrer"
              target="_blank"
              aria-label={`${source.title} (${t("chat.sources.title")})`}
            >
              {source.title}
            </a>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
