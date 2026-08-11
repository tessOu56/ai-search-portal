import type {
  AccessPermissionStatus,
  AccessRequestLifecycleStatus,
} from "@ai-search-portal/contracts";

export function permissionFor(
  status: AccessRequestLifecycleStatus
): AccessPermissionStatus {
  switch (status) {
    case "approved":
      return "granted";
    case "pending_approval":
    case "draft":
      return "pending";
    case "denied":
    case "expired":
    case "cancelled":
      return "revoked";
    default:
      return "none";
  }
}
