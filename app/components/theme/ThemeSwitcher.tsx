import { useEffect, useState } from "react";

import { Button } from "~/components/ui/Button";

/**
 * 主題切換器 — 語意 token 由 explore-design-sdk 供應（app/styles/tokens.portal.css）。
 * 切換僅改 <html> 的 data-theme 與 .dark，元件與畫面不需知道任何色值。
 * 持久化：localStorage（portal-theme / portal-mode），init script 在 root.tsx 防 FOUC。
 */
const THEMES = [
  { id: "wakakusa", label: "若草" },
  { id: "mitsurou", label: "蜜蝋" },
  { id: "yamabuki", label: "山吹" },
  { id: "matcha-fuji", label: "抹茶と藤" },
] as const;

/** 預設主題（PALETTE v5：若草指派 portal 為預設；蜜蝋為 [data-app] 基底、經 data-theme 移除切回） */
const DEFAULT_THEME = "wakakusa";

type ThemeId = (typeof THEMES)[number]["id"];

type ThemeSwitcherProps = {
  themeLabel: string;
  toLightLabel: string;
  toDarkLabel: string;
};

export function ThemeSwitcher({
  themeLabel,
  toLightLabel,
  toDarkLabel,
}: ThemeSwitcherProps) {
  const [theme, setTheme] = useState<ThemeId>(DEFAULT_THEME);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("portal-theme");
    if (savedTheme && THEMES.some((t) => t.id === savedTheme)) {
      setTheme(savedTheme as ThemeId);
    }
    // 未存過偏好 → 維持 DEFAULT_THEME（SSR 已於 <html> 掛 data-theme）
    setDark(window.localStorage.getItem("portal-mode") === "dark");
  }, []);

  function applyTheme(next: ThemeId) {
    setTheme(next);
    window.localStorage.setItem("portal-theme", next);
    if (next === "mitsurou") {
      delete document.documentElement.dataset.theme;
    } else {
      document.documentElement.dataset.theme = next;
    }
  }

  function applyMode(nextDark: boolean) {
    setDark(nextDark);
    window.localStorage.setItem("portal-mode", nextDark ? "dark" : "light");
    document.documentElement.classList.toggle("dark", nextDark);
  }

  return (
    <div className="flex items-center gap-space-8">
      <select
        value={theme}
        onChange={(event) => {
          const next = THEMES.find((item) => item.id === event.target.value);
          if (next) applyTheme(next.id);
        }}
        className="h-9 rounded-full border border-input bg-background px-space-16 text-type-14 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={themeLabel}
      >
        {THEMES.map((item) => (
          <option key={item.id} value={item.id}>
            {item.label}
          </option>
        ))}
      </select>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => applyMode(!dark)}
        aria-label={dark ? toLightLabel : toDarkLabel}
      >
        {dark ? "☀" : "☾"}
      </Button>
    </div>
  );
}
