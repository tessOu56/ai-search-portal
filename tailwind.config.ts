import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

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
      // Typography / spacing tokens（SSOT: explore-design-sdk semantic vars）
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
      spacing: {
        gutter: "var(--space-gutter)",
        section: "var(--space-section)",
        stack: "var(--space-stack)",
        inline: "var(--space-inline)",
        "control-x": "var(--space-control-x)",
        "control-y": "var(--space-control-y)",
        // data surface（insights / explorer / dashboard）密度檔
        "section-dense": "var(--space-section-dense)",
        "stack-dense": "var(--space-stack-dense)",
      },
      colors: {
        // Token SSOT: explore-design-sdk。CSS 變數為完整色值（非 HSL triplet），
        // 由 app/styles/tokens.portal.css（generated）+ app/tailwind.css 橋接段提供。
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
        // 蜜蝋 honey scale（預設主題 primary #ffda76 展開；800=dark primary、900=on-primary 文字）
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


