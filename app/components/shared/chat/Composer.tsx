import { ArrowRight, Mic } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { type FormEvent, useEffect, useId, useState } from "react";

import { useVoiceInput } from "~/components/shared/chat/useVoiceInput";
import { Button } from "~/components/ui/Button";
import { Input } from "~/components/ui/Input";
import { useI18n } from "~/shared/i18n/context";
import { cn } from "~/shared/utils/cn";

type ComposerProps = {
  className?: string;
  onSubmit: (query: string) => void;
  disabled?: boolean;
  /** Rotating typewriter placeholder (landing empty). Uses `hints`. */
  typewriter?: boolean;
  /** Short rotating placeholders; keep shorter than a single input line. */
  hints?: string[];
  suggestions?: string[];
};

const CHIP_CLASS =
  "h-auto min-h-8 max-w-full whitespace-normal break-words py-1.5 text-left";

function VoiceButton({
  disabled,
  listening,
  onToggle,
  t,
}: {
  disabled: boolean;
  listening: boolean;
  onToggle: () => void;
  t: (key: string) => string;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      data-testid="composer-voice"
      disabled={disabled}
      aria-pressed={listening}
      aria-label={
        listening ? t("composer.voice.stop") : t("composer.voice.start")
      }
      className="shrink-0"
      onClick={onToggle}
    >
      <Mic className="size-5" aria-hidden />
    </Button>
  );
}

function VoiceStatus({
  status,
  t,
}: {
  status: "idle" | "listening" | "denied" | "error";
  t: (key: string) => string;
}) {
  const messageKey =
    status === "listening"
      ? "composer.voice.listening"
      : status === "denied"
        ? "composer.voice.denied"
        : status === "error"
          ? "composer.voice.error"
          : null;
  return (
    <>
      {messageKey ? (
        <p
          className="text-type-12 text-muted-foreground"
          role="status"
          data-testid={
            status === "denied" || status === "error"
              ? "composer-voice-status"
              : undefined
          }
        >
          {t(messageKey)}
        </p>
      ) : null}
      <p className="sr-only">{t("composer.voice.privacy")}</p>
    </>
  );
}

/**
 * Shared ask bar for landing and conversation.
 * Surface: marketing (landing) / product (conversation).
 * Search field is SDK Input (not a raw unstyled input).
 */
export function Composer({
  className,
  onSubmit,
  disabled = false,
  typewriter = false,
  hints = [],
  suggestions = [],
}: ComposerProps) {
  const { t, locale } = useI18n();
  const reduceMotion = useReducedMotion();
  const inputId = useId();
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const [typed, setTyped] = useState("");
  const [hintIndex, setHintIndex] = useState(0);
  const {
    supported: voiceSupported,
    status: voiceStatus,
    toggle: toggleVoice,
  } = useVoiceInput({
    locale,
    enabled: !disabled,
    onTranscript: setValue,
  });

  const hintCount = hints.length;
  const activeHint = hintCount > 0 ? (hints[hintIndex % hintCount] ?? "") : "";
  const showTypewriter = typewriter && !value && !focused && !disabled;

  useEffect(() => {
    if (!showTypewriter || hintCount === 0) return;

    if (reduceMotion) {
      setTyped(activeHint);
      const timer = window.setTimeout(() => {
        setHintIndex((i) => (i + 1) % hintCount);
      }, 3200);
      return () => window.clearTimeout(timer);
    }

    let cancelled = false;
    let char = 0;
    setTyped("");

    const typeTimer = window.setInterval(() => {
      if (cancelled) return;
      char += 1;
      setTyped(activeHint.slice(0, char));
      if (char >= activeHint.length) {
        window.clearInterval(typeTimer);
        window.setTimeout(() => {
          if (cancelled) return;
          setTyped("");
          setHintIndex((i) => (i + 1) % hintCount);
        }, 1600);
      }
    }, 38);

    return () => {
      cancelled = true;
      window.clearInterval(typeTimer);
    };
  }, [showTypewriter, reduceMotion, activeHint, hintCount]);

  const submitQuery = (raw: string) => {
    const query = raw.trim();
    if (!query || disabled) return;
    setValue("");
    onSubmit(query);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const typedQuery = value.trim();
    if (typedQuery) {
      submitQuery(typedQuery);
      return;
    }
    if (!showTypewriter) return;
    const mapped =
      suggestions.length > 0
        ? (suggestions[hintIndex % suggestions.length] ?? activeHint)
        : activeHint;
    submitQuery(mapped);
  };

  return (
    <div
      className={cn("flex w-full max-w-2xl flex-col gap-space-8", className)}
    >
      <form
        onSubmit={handleSubmit}
        className="flex w-full items-center gap-space-8"
      >
        <label htmlFor={inputId} className="sr-only">
          {t("home.composer.label")}
        </label>
        <div className="relative min-w-0 flex-1">
          <Input
            id={inputId}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            autoComplete="off"
            disabled={disabled}
            className="pr-4"
            placeholder={showTypewriter ? "" : t("chat.placeholder")}
            aria-label={t("home.composer.label")}
          />
          {showTypewriter && (
            <span
              className="pointer-events-none absolute inset-y-0 left-0 flex items-center whitespace-nowrap px-6 text-base text-muted-foreground"
              aria-hidden
              data-testid="composer-hint"
            >
              <span className="min-w-0 truncate">{typed}</span>
              <span className="bg-muted-foreground/70 ml-0.5 inline-block h-[1.1em] w-px shrink-0 animate-pulse motion-reduce:animate-none" />
            </span>
          )}
        </div>
        {voiceSupported ? (
          <VoiceButton
            disabled={disabled}
            listening={voiceStatus === "listening"}
            onToggle={toggleVoice}
            t={t}
          />
        ) : null}
        <Button
          type="submit"
          size="icon"
          data-star-hot
          disabled={disabled}
          aria-busy={disabled}
          aria-label={t("chat.submit")}
          className="shrink-0"
        >
          <ArrowRight className="size-5" aria-hidden />
        </Button>
      </form>
      {voiceSupported ? <VoiceStatus status={voiceStatus} t={t} /> : null}
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-space-8">
          {suggestions.map((question) => (
            <Button
              key={question}
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={() => submitQuery(question)}
              className={CHIP_CLASS}
              data-testid="golden-question"
            >
              {question}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
