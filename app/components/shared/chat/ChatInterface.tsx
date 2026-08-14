import { useEffect, useRef, useState } from "react";

import { AssistantTurn } from "~/components/shared/chat/AssistantTurn";
import { Composer } from "~/components/shared/chat/Composer";
import { ChatBubble } from "~/components/shared/lui/ChatBubble";
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
  error?: string | null;
};

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  query?: string;
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
  };
}

function parseStableFailure(data: string) {
  const parsed = stableChatErrorSchema.safeParse(JSON.parse(data) as unknown);
  return parsed.success ? parsed.data.message : null;
}

const KEY_SUMMARY_WAITING = "chat.summary.waiting";
const KEY_CHAT_ERROR_PARSE = "chat.error.parse";

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
  const submitQueryRef = useRef<(raw: string) => void>(() => undefined);
  const logEndRef = useRef<HTMLDivElement>(null);
  const onAgentModeChangeRef = useRef(onAgentModeChange);
  onAgentModeChangeRef.current = onAgentModeChange;

  const patchAssistant = (id: string, patch: Partial<Message>) => {
    setMessages((prev) =>
      prev.map((message) =>
        message.id === id ? { ...message, ...patch } : message
      )
    );
  };

  useEffect(() => {
    return () => {
      streamRef.current?.close();
    };
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ block: "end" });
  }, [messages, isStreaming]);

  const submitQuery = (raw: string) => {
    const query = raw.trim();
    if (!query || isStreaming) return;

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

    const stream = new EventSource(apiChatQuery(query));
    streamRef.current = stream;
    const assistantId = assistantMessage.id;

    stream.addEventListener("meta", (event) => {
      try {
        const messageEvent = event as MessageEvent<string>;
        const data = parseStableMeta(messageEvent.data);
        if (!data) return;
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
        patchAssistant(assistantId, {
          sources: data.sources,
          nextSteps: data.nextSteps,
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
    });

    stream.addEventListener("done", () => {
      setIsStreaming(false);
      stream.close();
    });

    stream.onerror = () => {
      setIsStreaming(false);
      patchAssistant(assistantId, { error: t("chat.error.connection") });
      stream.close();
    };
  };

  submitQueryRef.current = submitQuery;

  useEffect(() => {
    if (!pendingQuery?.trim()) return;
    submitQueryRef.current(pendingQuery);
    onPendingQueryConsumed?.();
  }, [pendingQuery, onPendingQueryConsumed]);

  const liveAnnouncement = (() => {
    const last = messages[messages.length - 1];
    if (!last || last.role !== "assistant") return "";
    if (isStreaming && last.content) return last.content.slice(-120);
    if (!isStreaming && last.content) return last.content;
    return isStreaming ? t(KEY_SUMMARY_WAITING) : "";
  })();

  const lastAssistantIdValue = lastAssistantId.current;

  return (
    <div
      className="flex min-h-0 flex-1 flex-col"
      data-testid="conversation-workspace"
    >
      <div className="sr-only" aria-live="polite" aria-atomic="false">
        {liveAnnouncement}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
        <div
          id="home-chat"
          className="gap-space-24 py-space-24 mx-auto flex w-full max-w-3xl flex-col px-space-16"
          role="log"
          aria-relevant="additions"
          aria-label={t("chat.history.title")}
        >
          {messages.map((message) =>
            message.role === "user" ? (
              <ChatBubble key={message.id} variant="user">
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
                query={message.query}
                showContinue={
                  !isStreaming && message.id === lastAssistantIdValue
                }
                error={message.error}
              />
            )
          )}
          <div ref={logEndRef} />
        </div>
      </div>
      <div className="bg-background/80 border-t border-border p-space-16 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-space-8">
          <p className="text-type-12 text-muted-foreground">{t("chat.hint")}</p>
          <Composer onSubmit={submitQuery} disabled={isStreaming} />
        </div>
      </div>
    </div>
  );
}
