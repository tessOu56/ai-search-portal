import { useState } from "react";

import { ChatInterface } from "~/components/shared/chat/ChatInterface";
import { BrandMark } from "~/components/ui/BrandMark";
import { Button } from "~/components/ui/Button";
import { useI18n } from "~/shared/i18n/context";

import { WorkspaceFooter } from "./WorkspaceFooter";
import { WorkspaceViewSwitcher } from "./WorkspaceViewSwitcher";

type WorkspaceChatViewProps = {
  pendingQuery?: string | null;
  onPendingQueryConsumed?: () => void;
  onNewConversation: () => void;
};

/** Full-viewport LUI conversation shell after the first ask. Surface: product. */
export function WorkspaceChatView({
  pendingQuery = null,
  onPendingQueryConsumed,
  onNewConversation,
}: WorkspaceChatViewProps) {
  const { t } = useI18n();
  const [agentMode, setAgentMode] = useState<
    "live_llm" | "offline_fixture" | undefined
  >();

  return (
    <div className="relative flex min-h-dvh flex-col">
      <header className="flex shrink-0 items-center justify-between gap-space-16 p-space-16 md:px-space-32">
        <button
          type="button"
          onClick={onNewConversation}
          className="text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={t("chat.new")}
        >
          <BrandMark
            size="sm"
            lockup="horizontal"
            wordmark={t("app.title")}
            className="text-foreground"
          />
        </button>
        <div className="flex flex-wrap items-center justify-end gap-space-8">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onNewConversation}
          >
            {t("chat.new")}
          </Button>
          <WorkspaceViewSwitcher className="bg-background/70 backdrop-blur-md" />
        </div>
      </header>
      <ChatInterface
        pendingQuery={pendingQuery}
        onPendingQueryConsumed={onPendingQueryConsumed}
        onAgentModeChange={setAgentMode}
      />
      <WorkspaceFooter agentMode={agentMode} />
    </div>
  );
}
