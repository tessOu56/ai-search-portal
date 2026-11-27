/** Set at build time via vite `define` when targeting Cloudflare Workers. */
export function isWorkersRuntime(): boolean {
  return typeof __WORKERS_RUNTIME__ !== "undefined" && __WORKERS_RUNTIME__;
}
