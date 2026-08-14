import { useEffect, useState } from "react";

import { Button } from "~/components/ui/Button";
import { Select } from "~/components/ui/Select";

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
    if (savedTheme && THEMES.some((item) => item.id === savedTheme)) {
      setTheme(savedTheme as ThemeId);
    }
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
      <Select
        value={theme}
        options={THEMES.map((item) => ({
          value: item.id,
          label: item.label,
        }))}
        onValueChange={(next) => {
          const found = THEMES.find((item) => item.id === next);
          if (found) applyTheme(found.id);
        }}
        aria-label={themeLabel}
      />
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
