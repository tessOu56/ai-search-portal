/**
 * Context pack Remix-facing service.
 */

export {
  CONTEXT_PACK_COOKIE,
  DEFAULT_CONTEXT_PACK_ID,
  getPackMetric,
  listContextPackIds,
  listContextPacks,
  loadPackAssets,
  loadPackBindings,
  loadPackGlossary,
  loadPackMetrics,
  parsePackIdFromRequest,
  resetContextPackCache,
  resolveActivePackId,
  resolveContentRoot,
  resolveDomainBindings,
} from "~/shared/services/context-pack-loader.server";
