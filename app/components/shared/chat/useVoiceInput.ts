import { useCallback, useEffect, useRef, useState } from "react";

import type { Locale } from "~/shared/i18n/server";

export type VoiceStatus = "idle" | "listening" | "denied" | "error";

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechRecognitionResultEvent = {
  resultIndex: number;
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
};

function transcriptFromEvent(event: SpeechRecognitionResultEvent): string {
  const pieces: string[] = [];
  const rows = Array.prototype.slice.call(
    event.results,
    event.resultIndex
  ) as ArrayLike<{ transcript: string }>[];
  for (const row of rows) {
    const first = Array.prototype.at.call(row, 0) as
      { transcript: string } | undefined;
    if (first?.transcript) pieces.push(first.transcript);
  }
  return pieces.join("").trim();
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

export function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function speechLangForLocale(locale: Locale): string {
  return locale === "en" ? "en-US" : "zh-TW";
}

export function useVoiceInput({
  locale,
  enabled,
  onTranscript,
}: {
  locale: Locale;
  enabled: boolean;
  onTranscript: (text: string) => void;
}): {
  supported: boolean;
  status: VoiceStatus;
  toggle: () => void;
} {
  const supported = Boolean(getSpeechRecognitionCtor());
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const onTranscriptRef = useRef(onTranscript);
  onTranscriptRef.current = onTranscript;

  const stop = useCallback(() => {
    recRef.current?.stop();
    recRef.current = null;
    setStatus((current) => (current === "listening" ? "idle" : current));
  }, []);

  useEffect(() => {
    return () => {
      recRef.current?.abort();
      recRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!enabled && status === "listening") stop();
  }, [enabled, status, stop]);

  const toggle = useCallback(() => {
    if (!supported || !enabled) return;
    if (status === "listening") {
      stop();
      return;
    }
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return;
    const rec = new Ctor();
    rec.lang = speechLangForLocale(locale);
    rec.interimResults = true;
    rec.continuous = false;
    rec.onresult = (event) => {
      const trimmed = transcriptFromEvent(event);
      if (trimmed) onTranscriptRef.current(trimmed);
    };
    rec.onerror = (event) => {
      if (
        event.error === "not-allowed" ||
        event.error === "service-not-allowed"
      ) {
        setStatus("denied");
      } else if (event.error === "aborted") {
        setStatus("idle");
      } else {
        setStatus("error");
      }
      recRef.current = null;
    };
    rec.onend = () => {
      recRef.current = null;
      setStatus((current) => (current === "listening" ? "idle" : current));
    };
    try {
      rec.start();
      recRef.current = rec;
      setStatus("listening");
    } catch {
      setStatus("error");
    }
  }, [supported, enabled, status, stop, locale]);

  return { supported, status, toggle };
}
