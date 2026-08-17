import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Composer } from "./Composer";

vi.mock("motion/react", () => ({
  useReducedMotion: () => true,
}));

vi.mock("~/shared/i18n/context", () => ({
  useI18n: () => ({
    locale: "en",
    t: (key: string) => {
      const labels = new Map<string, string>([
        ["home.composer.label", "Ask a question"],
        ["chat.submit", "Send"],
        ["chat.placeholder", "Type a question"],
        ["composer.voice.start", "Voice input"],
        ["composer.voice.stop", "Stop voice input"],
        ["composer.voice.listening", "Listening"],
        ["composer.voice.denied", "Microphone permission denied"],
        ["composer.voice.error", "Voice recognition failed"],
        ["composer.voice.privacy", "Speech may be sent to the browser vendor"],
      ]);
      return labels.get(key) ?? key;
    },
  }),
}));

const HINT = "Ask about PII access";
const FULL_QUESTION = "Which datasets contain PII and what access do I need?";

class FakeSpeechRecognition {
  static last: FakeSpeechRecognition | null = null;
  lang = "";
  interimResults = false;
  continuous = false;
  onresult: ((event: unknown) => void) | null = null;
  onerror: ((event: unknown) => void) | null = null;
  onend: (() => void) | null = null;

  constructor() {
    FakeSpeechRecognition.last = this;
  }

  start() {
    return undefined;
  }

  stop() {
    this.onend?.();
  }

  abort() {
    this.onend?.();
  }
}

afterEach(() => {
  FakeSpeechRecognition.last = null;
  delete (window as Window & { SpeechRecognition?: unknown }).SpeechRecognition;
  delete (window as Window & { webkitSpeechRecognition?: unknown })
    .webkitSpeechRecognition;
});

describe("Composer", () => {
  it("rotates short hints in the typewriter overlay", () => {
    render(
      <Composer
        onSubmit={vi.fn()}
        typewriter
        hints={[HINT]}
        suggestions={[FULL_QUESTION]}
      />
    );
    expect(screen.getByTestId("composer-hint")).toHaveTextContent(HINT);
  });

  it("keeps golden-question chips as full questions", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(
      <Composer
        onSubmit={onSubmit}
        typewriter
        hints={[HINT]}
        suggestions={[FULL_QUESTION]}
      />
    );
    const chip = screen.getByTestId("golden-question");
    expect(chip).toHaveTextContent(FULL_QUESTION);
    await user.click(chip);
    expect(onSubmit).toHaveBeenCalledWith(FULL_QUESTION);
  });

  it("hides the mic when SpeechRecognition is unavailable", () => {
    render(<Composer onSubmit={vi.fn()} />);
    expect(screen.queryByTestId("composer-voice")).not.toBeInTheDocument();
  });

  it("fills the composer from speech and leaves submit to the user", async () => {
    Object.defineProperty(window, "SpeechRecognition", {
      configurable: true,
      value: FakeSpeechRecognition,
    });

    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<Composer onSubmit={onSubmit} />);
    const mic = screen.getByTestId("composer-voice");
    await user.click(mic);

    expect(mic).toHaveAttribute("aria-pressed", "true");
    expect(FakeSpeechRecognition.last?.lang).toBe("en-US");

    act(() => {
      FakeSpeechRecognition.last?.onresult?.({
        resultIndex: 0,
        results: [[{ transcript: "datasets with PII" }]],
      });
    });

    const input = screen.getByLabelText("Ask a question");
    expect(input).toHaveValue("datasets with PII");
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
