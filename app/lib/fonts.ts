import interLatin400 from "@fontsource/inter/files/inter-latin-400-normal.woff2?url";
import petronaLatin500 from "@fontsource/petrona/files/petrona-latin-500-normal.woff2?url";

const woff2 = {
  rel: "preload" as const,
  as: "font" as const,
  type: "font/woff2",
  crossOrigin: "anonymous" as const,
};

export const BODY_FONT_PRELOAD = {
  ...woff2,
  href: interLatin400,
};

export const DISPLAY_FONT_PRELOAD = {
  ...woff2,
  href: petronaLatin500,
};

export const FONT_PRELOADS = [BODY_FONT_PRELOAD];
