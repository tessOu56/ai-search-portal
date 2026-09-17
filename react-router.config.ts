import type { Config } from "@react-router/dev/config";
import { vercelPreset } from "@vercel/react-router/vite";

/**
 * T-2026-287 spike: Remix 2 → React Router 7 Framework Mode (Remix 3 rename).
 * RSC / `unstable_viteEnvironmentApi` stays off — not the production path.
 * Vite stays on 5.x; Tailwind stays on 3.x.
 */
export default {
  ssr: true,
  presets: process.env.VERCEL ? [vercelPreset()] : [],
} satisfies Config;
