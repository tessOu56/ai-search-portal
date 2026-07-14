import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const spaceScale = {
  "space-2": "var(--space-2)",
  "space-4": "var(--space-4)",
  "space-8": "var(--space-8)",
  "space-16": "var(--space-16)",
  "space-32": "var(--space-32)",
} as const;

const typeScale: Record<string, [string, { lineHeight: string }]> = {
  "type-10": ["var(--type-10)", { lineHeight: "1.4" }],
  "type-12": ["var(--type-12)", { lineHeight: "1.45" }],
  "type-14": ["var(--type-14)", { lineHeight: "1.5" }],
  "type-16": ["var(--type-16)", { lineHeight: "1.6" }],
  "type-18": ["var(--type-18)", { lineHeight: "1.55" }],
  "type-20": ["var(--type-20)", { lineHeight: "1.5" }],
  "type-22": ["var(--type-22)", { lineHeight: "1.45" }],
  "type-26": ["var(--type-26)", { lineHeight: "1.4" }],
  "type-32": ["var(--type-32)", { lineHeight: "1.35" }],
  "type-36": ["var(--type-36)", { lineHeight: "1.3" }],
  "type-42": ["var(--type-42)", { lineHeight: "1.25" }],
  "type-52": ["var(--type-52)", { lineHeight: "1.15" }],
  "type-62": ["var(--type-62)", { lineHeight: "1.1" }],
  "type-72": ["var(--type-72)", { lineHeight: "1.05" }],
  "type-108": ["var(--type-108)", { lineHeight: "1" }],
};

export default {
  darkMode: ["class"],
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        display: "var(--font-display)",
        sans: "var(--font-body)",
        mono: "var(--font-mono)",
      },
      letterSpacing: {
        display: "var(--type-display-tracking)",
        title: "var(--type-title-tracking)",
        body: "var(--type-body-tracking)",
        label: "var(--type-label-tracking)",
      },
      lineHeight: {
        display: "var(--type-display-leading)",
        title: "var(--type-title-leading)",
        body: "var(--type-body-leading)",
        label: "var(--type-label-leading)",
      },
      fontSize: {
        ...typeScale,
      },
      spacing: {
        gutter: "var(--space-gutter)",
        section: "var(--space-section)",
        stack: "var(--space-stack)",
        inline: "var(--space-inline)",
        "control-x": "var(--space-control-x)",
        "control-y": "var(--space-control-y)",
        "section-dense": "var(--space-section-dense)",
        "stack-dense": "var(--space-stack-dense)",
        ...spaceScale,
      },
      colors: {
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        brand: {
          50: "#fff9e8",
          100: "#fff1c9",
          200: "#ffe7a3",
          300: "#ffdf8c",
          400: "#ffda76",
          500: "#f2c24e",
          600: "#d9a32b",
          700: "#b98413",
          800: "#8a6500",
          900: "#5c4a00",
        },
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
