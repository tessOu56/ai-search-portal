/**
 * Agent LLM provider mode (T-271). Default mock keeps CI on offline fixtures.
 */
export type AgentLlmMode = "mock" | "openai" | "gateway";

export function readAgentLlmMode(): AgentLlmMode {
  const raw = (process.env.AGENT_LLM_MODE ?? "mock").trim().toLowerCase();
  if (raw === "openai" || raw === "gateway") return raw;
  return "mock";
}

export function shouldUseLiveLlm(
  mode: AgentLlmMode = readAgentLlmMode()
): boolean {
  return mode === "openai" || mode === "gateway";
}

export function agentModeLabel(mode: AgentLlmMode): string {
  if (mode === "openai") return "live_llm";
  if (mode === "gateway") return "gateway_llm";
  return "offline_fixture";
}
