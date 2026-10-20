import interLatin400 from "@fontsource/inter/files/inter-latin-400-normal.woff2?url";
import petronaLatin500 from "@fontsource/petrona/files/petrona-latin-500-normal.woff2?url";

export const FONT_PRELOADS = [
  {
    rel: "preload" as const,
    href: petronaLatin500,
    as: "font" as const,
    type: "font/woff2",
    crossOrigin: "anonymous" as const,
  },
  {
    rel: "preload" as const,
    href: interLatin400,
    as: "font" as const,
    type: "font/woff2",
    crossOrigin: "anonymous" as const,
  },
];
