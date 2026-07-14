import { ArrowRight } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { type FormEvent, useEffect, useId, useState } from "react";

import { useI18n } from "~/shared/i18n/context";
import { cn } from "~/shared/utils/cn";

type HomeAskPanelProps = {
  className?: string;
  onSubmit: (query: string) => void;
};

const SUGGEST_KEYS = [
  "home.composer.suggest.1",
  "home.composer.suggest.2",
  "home.composer.suggest.3",
] as const;

/**
 * Design/tech-site ask panel: typewriter suggestions + arrow submit.
 * Surface: marketing.
 */
export function HomeAskPanel({ className, onSubmit }: HomeAskPanelProps) {
  const { t } = useI18n();
  const reduceMotion = useReducedMotion();
  const inputId = useId();
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const [typed, setTyped] = useState("");
  const [suggestIndex, setSuggestIndex] = useState(0);

  const suggestions = SUGGEST_KEYS.map((key) => t(key));
  const suggestCount = suggestions.length;
  const activeSuggest =
    suggestCount > 0 ? (suggestions[suggestIndex % suggestCount] ?? "") : "";
  const showTypewriter = !value && !focused;

  useEffect(() => {
    if (!showTypewriter || suggestCount === 0) return;

    if (reduceMotion) {
      setTyped(activeSuggest);
      const timer = window.setTimeout(() => {
        setSuggestIndex((i) => (i + 1) % suggestCount);
      }, 3200);
      return () => window.clearTimeout(timer);
    }

    let cancelled = false;
    let char = 0;
    setTyped("");

    const typeTimer = window.setInterval(() => {
      if (cancelled) return;
      char += 1;
      setTyped(activeSuggest.slice(0, char));
      if (char >= activeSuggest.length) {
        window.clearInterval(typeTimer);
        window.setTimeout(() => {
          if (cancelled) return;
          setTyped("");
          setSuggestIndex((i) => (i + 1) % suggestCount);
        }, 1600);
      }
    }, 38);

    return () => {
      cancelled = true;
      window.clearInterval(typeTimer);
    };
  }, [showTypewriter, reduceMotion, activeSuggest, suggestCount]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const query = value.trim() || (showTypewriter ? activeSuggest.trim() : "");
    if (!query) return;
    onSubmit(query);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "border-border/70 bg-background/70 flex w-full max-w-2xl items-center gap-space-8 rounded-2xl border p-space-8 shadow-sm backdrop-blur-md",
        className
      )}
    >
      <label htmlFor={inputId} className="sr-only">
        {t("home.composer.label")}
      </label>
      <div className="relative min-w-0 flex-1">
        <input
          id={inputId}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoComplete="off"
          className="h-12 w-full bg-transparent px-space-16 text-type-16 text-foreground outline-none placeholder:text-muted-foreground"
          placeholder={showTypewriter ? "" : t("chat.placeholder")}
          aria-label={t("home.composer.label")}
        />
        {showTypewriter && (
          <span
            className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-space-16 text-type-16 text-muted-foreground"
            aria-hidden
          >
            {typed}
            <span className="bg-muted-foreground/70 ml-0.5 inline-block h-[1.1em] w-px animate-pulse" />
          </span>
        )}
      </div>
      <button
        type="submit"
        data-star-hot
        className="hover:bg-primary/90 inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={t("chat.submit")}
      >
        <ArrowRight className="size-5" aria-hidden />
      </button>
    </form>
  );
}
