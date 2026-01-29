import { createContext, type ReactNode, useContext } from "react";

import type { Locale } from "./server";

type Translations = Record<string, string>;

type I18nContextValue = {
  locale: Locale;
  t: (key: string, vars?: Record<string, string>) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  locale,
  translations,
  children,
}: {
  locale: Locale;
  translations: Translations;
  children: ReactNode;
}) {
  const t = (key: string, vars?: Record<string, string>): string => {
    let value = translations[key] ?? key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        value = value.replace(new RegExp(`\\{${k}\\}`, "g"), v);
      }
    }
    return value;
  };
  return (
    <I18nContext.Provider value={{ locale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    return {
      locale: "zh-TW",
      t: (key: string) => key,
    };
  }
  return ctx;
}
