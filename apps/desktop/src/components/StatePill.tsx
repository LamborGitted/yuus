import type { ImageReplaceItem } from "../lib/types";
import type { SupportedLocale } from "../lib/i18n";
import { translations } from "../lib/i18n";

/** 替换状态标签 - 根据 idle/queued/done 三种状态切换样式 */
export function StatePill({
  item,
  active,
  locale,
}: {
  item: ImageReplaceItem;
  active: boolean;
  locale: SupportedLocale;
}) {
  const copy = translations[locale];
  const label = item.replaced
    ? copy.state.done
    : item.replacementPath
      ? copy.state.queued
      : copy.state.idle;

  const className = item.replaced
    ? active
      ? "bg-[var(--overlay-strong)] text-copy-strong"
      : "bg-brand text-white"
    : item.replacementPath
      ? active
        ? "bg-[var(--overlay-strong)] text-copy-strong"
        : "bg-[var(--overlay-medium)] text-copy"
      : active
        ? "bg-[var(--overlay-medium)] text-copy"
        : "bg-surface-2 text-copy-muted";

  return (
    <span className={`px-3 py-1 text-[10px] uppercase tracking-[0.22em] ${className}`}>
      {label}
    </span>
  );
}
