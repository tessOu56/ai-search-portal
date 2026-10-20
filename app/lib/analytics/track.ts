/** Fire-and-forget wrappers so route modules do not import the analytics chunk. */

export function trackSearchSubmitted(input: {
  surface: "chat" | "catalog_search";
  queryLength: number;
}): void {
  void import("./product-events").then((mod) =>
    mod.trackSearchSubmitted(input)
  );
}

export function trackAnswerRendered(input: {
  surface: "chat";
  hasSummary: boolean;
  sourceCount: number;
  durationMs: number;
}): void {
  void import("./product-events").then((mod) => mod.trackAnswerRendered(input));
}

export function trackCitationClicked(input: {
  surface: "chat";
  kind: "internal" | "external";
  index: number;
}): void {
  void import("./product-events").then((mod) =>
    mod.trackCitationClicked(input)
  );
}
