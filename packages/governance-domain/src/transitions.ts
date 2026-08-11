/**
 * Access-request lifecycle transition table (shared Remix + Hono).
 */

import type { AccessRequestLifecycleStatus } from "@ai-search-portal/contracts";

export type AccessTransitionAction =
  "submit" | "approve" | "deny" | "cancel" | "edit" | "expire";

/** Target status for a successful transition. `edit` stays on pending_approval. */
export const ACCESS_TRANSITION_TABLE: Record<
  AccessRequestLifecycleStatus,
  Partial<Record<AccessTransitionAction, AccessRequestLifecycleStatus>>
> = {
  draft: {
    submit: "pending_approval",
    cancel: "cancelled",
    expire: "expired",
  },
  pending_approval: {
    approve: "approved",
    deny: "denied",
    cancel: "cancelled",
    edit: "pending_approval",
    expire: "expired",
  },
  approved: {},
  denied: {},
  expired: {},
  cancelled: {},
};

function transitionTarget(
  from: AccessRequestLifecycleStatus,
  action: AccessTransitionAction
): AccessRequestLifecycleStatus | undefined {
  // from is a closed AccessRequestLifecycleStatus union (not user input).
  // eslint-disable-next-line security/detect-object-injection -- typed enum key
  const row = ACCESS_TRANSITION_TABLE[from];
  switch (action) {
    case "submit":
      return row.submit;
    case "approve":
      return row.approve;
    case "deny":
      return row.deny;
    case "cancel":
      return row.cancel;
    case "edit":
      return row.edit;
    case "expire":
      return row.expire;
    default:
      return undefined;
  }
}

export function canTransition(
  from: AccessRequestLifecycleStatus,
  action: AccessTransitionAction
): boolean {
  return transitionTarget(from, action) !== undefined;
}

export function nextStatus(
  from: AccessRequestLifecycleStatus,
  action: AccessTransitionAction
): AccessRequestLifecycleStatus | null {
  return transitionTarget(from, action) ?? null;
}

export function reviewActionForDecision(
  decision: "approved" | "denied"
): AccessTransitionAction {
  return decision === "approved" ? "approve" : "deny";
}
