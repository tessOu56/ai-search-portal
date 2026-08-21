import { Link } from "@remix-run/react";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";

import { ChatInterface } from "~/components/shared/chat/ChatInterface";
import { Button } from "~/components/ui/Button";
import { useI18n } from "~/shared/i18n/context";

import { WorkspaceFooter } from "./WorkspaceFooter";
import { useWorkspaceSession } from "./WorkspaceSession";

type WorkspaceChatViewProps = {
  pendingQuery?: string | null;
  onPendingQueryConsumed?: () => void;
  onNewConversation?: () => void;
};

/** Full-viewport LUI conversation shell after the first ask. Surface: product. */
export function WorkspaceChatView({
  pendingQuery = null,
  onPendingQueryConsumed,
  onNewConversation,
}: WorkspaceChatViewProps) {
  const { t } = useI18n();
  const { overviewReturnHref } = useWorkspaceSession();
  const [agentMode, setAgentMode] = useState<
    "live_llm" | "offline_fixture" | undefined
  >();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-space-8 px-space-16 pt-space-8 md:px-space-32">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="gap-space-8 px-space-8"
        >
          <Link to={overviewReturnHref}>
            <ArrowLeft className="size-4" aria-hidden />
            {t("nav.back")}
          </Link>
        </Button>
        {onNewConversation ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onNewConversation}
          >
            {t("chat.new")}
          </Button>
        ) : null}
      </div>
      <ChatInterface
        pendingQuery={pendingQuery}
        onPendingQueryConsumed={onPendingQueryConsumed}
        onAgentModeChange={setAgentMode}
      />
      <WorkspaceFooter agentMode={agentMode} />
    </div>
  );
}
