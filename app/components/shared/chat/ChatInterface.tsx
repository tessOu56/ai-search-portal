import { useEffect, useRef, useState } from "react";

import { AssistantTurn } from "~/components/shared/chat/AssistantTurn";
import { Composer } from "~/components/shared/chat/Composer";
import { ChatBubble } from "~/components/shared/lui/ChatBubble";
import {
  trackAnswerRendered,
  trackSearchSubmitted,
} from "~/lib/analytics/product-events";
import { apiChatQuery } from "~/shared/api/paths";
import {
  stableChatErrorSchema,
  stableChatFinalSchema,
  stableChatMetaSchema,
} from "~/shared/contracts";
import { useI18n } from "~/shared/i18n/context";

type AssistantEvidence = {
  summary?: string;
  confidence?: number;
  sources?: Array<{ title: string; url: string; source?: string }>;
  nextSteps?: string[];
  nextActions?: Array<{ label: string; href: string }>;
  error?: string | null;
};

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  query?: string;
  fallbackReason?: import("./AiFallbackPanel").AiFallbackReason;
} & AssistantEvidence;

type AgentMode = "live_llm" | "offline_fixture";

function parseStableMeta(data: string) {
  const parsed = stableChatMetaSchema.safeParse(JSON.parse(data) as unknown);
  if (!parsed.success) return null;
  return {
    summary: parsed.data.summary,
    confidence: parsed.data.confidence,
    agentMode: parsed.data.agentMode,
  };
}

function parseStableFinal(data: string) {
  const parsed = stableChatFinalSchema.safeParse(JSON.parse(data) as unknown);
  if (!parsed.success) return null;
  return {
    sources: parsed.data.sources,
    nextSteps: parsed.data.nextSteps,
    nextActions: parsed.data.nextActions,
  };
}

function parseStableFailure(data: string) {
  const parsed = stableChatErrorSchema.safeParse(JSON.parse(data) as unknown);
  return parsed.success ? parsed.data.message : null;
}

const KEY_SUMMARY_WAITING = "chat.summary.waiting";
const KEY_CHAT_ERROR_PARSE = "chat.error.parse";

const CHAT_STREAM_TIMEOUT_MS = 45_000;

type ChatInterfaceProps = {
  pendingQuery?: string | null;
  onPendingQueryConsumed?: () => void;
  onAgentModeChange?: (mode: AgentMode) => void;
};

export function ChatInterface({
  pendingQuery = null,
  onPendingQueryConsumed,
  onAgentModeChange,
}: ChatInterfaceProps) {
  const { t } = useI18n();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const lastAssistantId = useRef<string | null>(null);
  const streamRef = useRef<EventSource | null>(null);
  const streamTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const submitQueryRef = useRef<(raw: string) => void>(() => undefined);
  const logEndRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const onAgentModeChangeRef = useRef(onAgentModeChange);
  onAgentModeChangeRef.current = onAgentModeChange;
  /** Same-instance Strict Mode effect re-run; remount gets a fresh ref. */
  const consumedPendingQueryRef = useRef<string | null>(null);
  const evidenceRef = useRef({ hasSummary: false, sourceCount: 0 });

  const patchAssistant = (id: string, patch: Partial<Message>) => {
    setMessages((prev) =>
      prev.map((message) =>
        message.id === id ? { ...message, ...patch } : message
      )
    );
  };

  useEffect(() => {
    const container = scrollRef.current;
    const end = logEndRef.current;
    if (!container || !end) return;
    const gap =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    // Follow new turns if the user is already near the bottom (or on the first turn).
    if (messages.length <= 2 || gap < 160) {
      end.scrollIntoView({ block: "end" });
    }
  }, [messages, isStreaming]);

  const submitQuery = (raw: string) => {
    const query = raw.trim();
    if (!query || isStreaming) return;

    streamRef.current?.close();
    streamRef.current = null;
    if (streamTimeoutRef.current) {
      clearTimeout(streamTimeoutRef.current);
      streamTimeoutRef.current = null;
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: query,
    };
    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
      query,
    };
    lastAssistantId.current = assistantMessage.id;
    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setIsStreaming(true);
    const startedAt = performance.now();
    evidenceRef.current = { hasSummary: false, sourceCount: 0 };
    trackSearchSubmitted({ surface: "chat", queryLength: query.length });

    const stream = new EventSource(apiChatQuery(query));
    streamRef.current = stream;
    const assistantId = assistantMessage.id;

    const clearStreamTimeout = () => {
      if (streamTimeoutRef.current) {
        clearTimeout(streamTimeoutRef.current);
        streamTimeoutRef.current = null;
      }
    };

    streamTimeoutRef.current = setTimeout(() => {
      if (streamRef.current) {
        patchAssistant(assistantId, {
          error: t("chat.error.timeout"),
          fallbackReason: "timeout",
        });
        setIsStreaming(false);
        streamRef.current.close();
        streamRef.current = null;
      }
      clearStreamTimeout();
    }, CHAT_STREAM_TIMEOUT_MS);

    stream.addEventListener("meta", (event) => {
      try {
        const messageEvent = event as MessageEvent<string>;
        const data = parseStableMeta(messageEvent.data);
        if (!data) return;
        evidenceRef.current.hasSummary = Boolean(data.summary);
        patchAssistant(assistantId, {
          summary: data.summary,
          confidence: data.confidence,
        });
        if (
          data.agentMode === "live_llm" ||
          data.agentMode === "offline_fixture"
        ) {
          onAgentModeChangeRef.current?.(data.agentMode);
        }
      } catch {
        patchAssistant(assistantId, { error: t(KEY_CHAT_ERROR_PARSE) });
      }
    });

    stream.addEventListener("token", (event) => {
      const messageEvent = event as MessageEvent<string>;
      const token = messageEvent.data;
      setMessages((prev) =>
        prev.map((message) => {
          if (message.id !== assistantId) return message;
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
        evidenceRef.current.sourceCount = data.sources.length;
        patchAssistant(assistantId, {
          sources: data.sources,
          nextSteps: data.nextSteps,
          nextActions: data.nextActions,
        });
      } catch {
        patchAssistant(assistantId, { error: t(KEY_CHAT_ERROR_PARSE) });
      }
    });

    stream.addEventListener("failure", (event) => {
      try {
        const messageEvent = event as MessageEvent<string>;
        const message = parseStableFailure(messageEvent.data);
        patchAssistant(assistantId, {
          error: message ?? t(KEY_CHAT_ERROR_PARSE),
        });
      } catch {
        patchAssistant(assistantId, { error: t(KEY_CHAT_ERROR_PARSE) });
      }
      setIsStreaming(false);
      stream.close();
      clearStreamTimeout();
    });

    stream.addEventListener("done", () => {
      setIsStreaming(false);
      stream.close();
      clearStreamTimeout();
      trackAnswerRendered({
        surface: "chat",
        hasSummary: evidenceRef.current.hasSummary,
        sourceCount: evidenceRef.current.sourceCount,
        durationMs: Math.round(performance.now() - startedAt),
      });
    });

    stream.onerror = () => {
      setIsStreaming(false);
      patchAssistant(assistantId, { error: t("chat.error.connection") });
      stream.close();
      clearStreamTimeout();
    };
  };

  submitQueryRef.current = submitQuery;
  const onPendingQueryConsumedRef = useRef(onPendingQueryConsumed);
  onPendingQueryConsumedRef.current = onPendingQueryConsumed;

  useEffect(() => {
    const trimmed = pendingQuery?.trim();
    if (!trimmed) return;
    if (consumedPendingQueryRef.current === trimmed) {
      onPendingQueryConsumedRef.current?.();
      return;
    }
    consumedPendingQueryRef.current = trimmed;
    submitQueryRef.current(trimmed);
    onPendingQueryConsumedRef.current?.();
  }, [pendingQuery]);

  const liveAnnouncement = (() => {
    const last = messages[messages.length - 1];
    if (!last || last.role !== "assistant") return "";
    if (isStreaming) return t(KEY_SUMMARY_WAITING);
    if (last.summary) return last.summary;
    return last.content || "";
  })();

  const lastAssistantIdValue = lastAssistantId.current;

  return (
    <div
      className="flex min-h-0 flex-1 flex-col"
      data-testid="conversation-workspace"
    >
      <div
        className="sr-only"
        role="log"
        aria-live="polite"
        aria-atomic="false"
        aria-relevant="additions"
      >
        {liveAnnouncement}
      </div>
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden"
      >
        <div
          id="conversation-log"
          className="mx-auto flex w-full max-w-3xl flex-col gap-space-16 px-space-16 py-space-32"
          role="region"
          aria-label={t("chat.history.title")}
          aria-busy={isStreaming}
        >
          {messages.length === 0 ? (
            <p className="text-type-14 text-muted-foreground">
              {t("chat.history.empty")}
            </p>
          ) : null}
          {messages.map((message) =>
            message.role === "user" ? (
              <ChatBubble
                key={message.id}
                variant="user"
                data-testid="user-turn"
              >
                <span className="sr-only">{t("chat.message.user")}: </span>
                {message.content}
              </ChatBubble>
            ) : (
              <AssistantTurn
                key={message.id}
                content={message.content}
                isStreaming={isStreaming && message.id === lastAssistantIdValue}
                summary={message.summary}
                confidence={message.confidence}
                sources={message.sources}
                nextSteps={message.nextSteps}
                nextActions={message.nextActions}
                query={message.query}
                showContinue={
                  !isStreaming && message.id === lastAssistantIdValue
                }
                error={message.error}
                fallbackReason={message.fallbackReason}
              />
            )
          )}
          <div ref={logEndRef} />
        </div>
      </div>
      <div className="bg-background/80 border-t border-border p-space-16 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-space-8">
          <p
            id="chat-composer-hint"
            className="text-type-12 text-muted-foreground"
          >
            {t("chat.hint")}
          </p>
          <Composer
            onSubmit={submitQuery}
            disabled={isStreaming}
            describedBy="chat-composer-hint"
          />
        </div>
      </div>
    </div>
  );
}
