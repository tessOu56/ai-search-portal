/** Build the "track it" deep link used after an approve outcome (T-186 #5). */
export function myApisHighlightHref(requestId: string): string {
  return `/my-apis?sessionRole=requester&highlight=${encodeURIComponent(requestId)}`;
}
