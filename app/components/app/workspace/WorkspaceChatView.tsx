import { useState } from "react";

import { ChatInterface } from "~/components/shared/chat/ChatInterface";

import { WorkspaceFooter } from "./WorkspaceFooter";

type WorkspaceChatViewProps = {
  pendingQuery?: string | null;
  onPendingQueryConsumed?: () => void;
};

/** Full-viewport LUI conversation shell after the first ask. Surface: product. */
export function WorkspaceChatView({
  pendingQuery = null,
  onPendingQueryConsumed,
}: WorkspaceChatViewProps) {
  const [agentMode, setAgentMode] = useState<
    "live_llm" | "offline_fixture" | undefined
  >();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ChatInterface
        pendingQuery={pendingQuery}
        onPendingQueryConsumed={onPendingQueryConsumed}
        onAgentModeChange={setAgentMode}
      />
      <WorkspaceFooter agentMode={agentMode} />
    </div>
  );
}
