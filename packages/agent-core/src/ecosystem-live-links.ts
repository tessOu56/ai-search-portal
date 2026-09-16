/**
 * Featured LIVE deep links for Portal RAG / overview redirects (T-2026-282).
 * Portal stays directory + RAG — not a second events admin or event CMS.
 */

export const NX_EVENT_PORTAL_LIVE =
  "https://nx-event-portal.vercel.app/zh-TW/events";

export const PLINTH_STOREFRONT_LIVE =
  "https://metalcraft-storefront-eta.vercel.app/en";

export const PLINTH_LOT_LIVE =
  "https://metalcraft-storefront-eta.vercel.app/en/lots/lot-1";

export const PLINTH_AUCTIONS_LIVE =
  "https://metalcraft-storefront-eta.vercel.app/en/auctions";

export const VUE_MOTION_LAB_LIVE =
  "https://tessou56.github.io/vue-motion-sandbox/recipes";

/** Keep in sync with app/shared/ecosystem-live.ts */

export type EcosystemTopic =
  "talk" | "auction" | "line_commerce" | "food" | null;

export function detectEcosystemTopic(query: string): EcosystemTopic {
  const q = query.toLowerCase();
  if (/食譜|菜餚|recipe|dish(es)?|food|ingredient|料理|原物料|菜單/.test(q)) {
    return "food";
  }
  if (/拍賣|拍品|auction|plinth|競標|孤品|\blot\b/.test(q)) {
    return "auction";
  }
  if (
    /line\s*商務|line commerce|liff|line\s*報名|line\s*活動|line_commerce/.test(
      q
    )
  ) {
    return "line_commerce";
  }
  if (
    /講座|工作坊|活動報名|報名活動|票券|核銷|checkout|event.?portal|talk\b|workshop/.test(
      q
    ) ||
    (/活動|票|報名|場次/.test(q) &&
      !/metadata|catalog|pii|lineage|訂單api/.test(q))
  ) {
    return "talk";
  }
  return null;
}
