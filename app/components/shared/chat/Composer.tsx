import { ArrowRight } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { type FormEvent, useEffect, useId, useState } from "react";

import { useI18n } from "~/shared/i18n/context";
import { cn } from "~/shared/utils/cn";

type ComposerProps = {
  className?: string;
  onSubmit: (query: string) => void;
  disabled?: boolean;
  /** Rotating typewriter placeholder (landing empty). */
  typewriter?: boolean;
  suggestions?: string[];
};

/**
 * Shared ask bar for landing and conversation.
 * Surface: marketing (landing) / product (conversation).
 */
export function Composer({
  className,
  onSubmit,
  disabled = false,
  typewriter = false,
  suggestions = [],
}: ComposerProps) {
  const { t } = useI18n();
  const reduceMotion = useReducedMotion();
  const inputId = useId();
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const [typed, setTyped] = useState("");
  const [suggestIndex, setSuggestIndex] = useState(0);

  const suggestCount = suggestions.length;
  const activeSuggest =
    suggestCount > 0 ? (suggestions[suggestIndex % suggestCount] ?? "") : "";
  const showTypewriter = typewriter && !value && !focused && !disabled;

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

  const submitQuery = (raw: string) => {
    const query = raw.trim();
    if (!query || disabled) return;
    setValue("");
    onSubmit(query);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    submitQuery(value.trim() || (showTypewriter ? activeSuggest.trim() : ""));
  };

  return (
    <div
      className={cn("flex w-full max-w-2xl flex-col gap-space-8", className)}
    >
      <form
        onSubmit={handleSubmit}
        className="border-border/70 bg-background/70 flex w-full items-start gap-space-8 rounded-2xl border p-space-8 shadow-sm backdrop-blur-md"
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
            disabled={disabled}
            className="min-h-12 w-full bg-transparent px-space-16 py-3 text-type-16 leading-snug text-foreground outline-none placeholder:text-muted-foreground disabled:opacity-60"
            placeholder={showTypewriter ? "" : t("chat.placeholder")}
            aria-label={t("home.composer.label")}
          />
          {showTypewriter && (
            <span
              className="pointer-events-none absolute inset-x-0 top-0 flex min-h-12 items-start whitespace-normal break-words px-space-16 py-3 text-type-16 leading-snug text-muted-foreground"
              aria-hidden
            >
              <span className="min-w-0">{typed}</span>
              <span className="bg-muted-foreground/70 ml-0.5 mt-0.5 inline-block h-[1.1em] w-px shrink-0 animate-pulse motion-reduce:animate-none" />
            </span>
          )}
        </div>
        <button
          type="submit"
          data-star-hot
          disabled={disabled}
          aria-busy={disabled}
          className="hover:bg-primary/90 inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98] disabled:opacity-50"
          aria-label={t("chat.submit")}
        >
          <ArrowRight className="size-5" aria-hidden />
        </button>
      </form>
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {suggestions.map((question) => (
            <button
              key={question}
              type="button"
              disabled={disabled}
              onClick={() => submitQuery(question)}
              className="inline-flex h-auto min-h-8 max-w-full items-center whitespace-normal break-words rounded-xl border border-border bg-background px-3 py-1.5 text-left text-xs font-medium hover:bg-muted disabled:opacity-50"
              data-testid="golden-question"
            >
              {question}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
