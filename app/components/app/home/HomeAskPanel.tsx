import { Composer } from "~/components/shared/chat/Composer";
import { useI18n } from "~/shared/i18n/context";

type HomeAskPanelProps = {
  className?: string;
  onSubmit: (query: string) => void;
};

const HINT_KEYS = [
  "home.composer.hint.1",
  "home.composer.hint.2",
  "home.composer.hint.3",
] as const;

const SUGGEST_KEYS = [
  "home.composer.suggest.1",
  "home.composer.suggest.2",
  "home.composer.suggest.3",
] as const;

/**
 * Landing ask panel — shared Composer with short typewriter hints + suggestion chips.
 * Surface: marketing.
 */
export function HomeAskPanel({ className, onSubmit }: HomeAskPanelProps) {
  const { t } = useI18n();
  const hints = HINT_KEYS.map((key) => t(key));
  const suggestions = SUGGEST_KEYS.map((key) => t(key));

  return (
    <Composer
      className={className}
      onSubmit={onSubmit}
      typewriter
      hints={hints}
      suggestions={suggestions}
    />
  );
}
