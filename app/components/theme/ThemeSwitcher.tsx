import { useEffect, useState } from "react";

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

export function ThemeSwitcher() {
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
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-1 rounded-full border border-border bg-card px-2 py-1 shadow-sm">
      {THEMES.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => applyTheme(t.id)}
          aria-pressed={theme === t.id}
          className={
            theme === t.id
              ? "rounded-full bg-primary px-3 py-1 text-xs text-primary-foreground"
              : "rounded-full px-3 py-1 text-xs text-muted-foreground hover:bg-accent"
          }
        >
          {t.label}
        </button>
      ))}
      <button
        type="button"
        onClick={() => applyMode(!dark)}
        aria-label={dark ? "切換為亮色" : "切換為暗色"}
        className="rounded-full px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
      >
        {dark ? "☀" : "☾"}
      </button>
    </div>
  );
}
