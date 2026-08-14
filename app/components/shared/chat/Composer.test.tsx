import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Composer } from "./Composer";

vi.mock("motion/react", () => ({
  useReducedMotion: () => true,
}));

vi.mock("~/shared/i18n/context", () => ({
  useI18n: () => ({
    t: (key: string) => {
      const labels = new Map<string, string>([
        ["home.composer.label", "Ask a question"],
        ["chat.submit", "Send"],
        ["chat.placeholder", "Type a question"],
      ]);
      return labels.get(key) ?? key;
    },
  }),
}));

const HINT = "Ask about PII access";
const FULL_QUESTION = "Which datasets contain PII and what access do I need?";

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
});
