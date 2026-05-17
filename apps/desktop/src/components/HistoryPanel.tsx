import type { HistoryEntry } from "../lib/types";
import type { SupportedLocale, TranslationTree } from "../lib/i18n";

function formatTimestamp(ts: string): string {
  const ms = parseInt(ts, 10);
  if (isNaN(ms)) return ts;
  const date = new Date(ms);
  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function HistoryPanel({
  entries,
  copy,
  onClose,
}: {
  entries: HistoryEntry[];
  copy: TranslationTree;
  locale?: SupportedLocale;
  onClose: () => void;
}) {
  return (
    <div className="history-overlay" onClick={onClose}>
      <div className="history-panel" onClick={(e) => e.stopPropagation()}>
        <div className="history-header">
          <h2>{copy.historyTitle}</h2>
          <button type="button" className="history-close" onClick={onClose}>
            {copy.historyClose}
          </button>
        </div>
        <div className="history-list">
          {entries.length === 0 ? (
            <div className="history-empty">{copy.historyEmpty}</div>
          ) : (
            [...entries].reverse().map((entry, i) => {
              const actionLabel =
                entry.action === "replace"
                  ? copy.historyActionReplace
                  : entry.action === "undo"
                    ? copy.historyActionUndo
                    : copy.historyActionRedo;

              return (
                <div key={`${entry.timestamp}-${i}`} className="history-entry">
                  <span className={`history-action-badge ${entry.action}`}>{actionLabel}</span>
                  <span className="history-file" title={entry.originalPath}>
                    {entry.originalName}
                  </span>
                  <span className="history-time">{formatTimestamp(entry.timestamp)}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
