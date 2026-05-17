import { useEffect, useRef, useState } from "react";
import { IMAGE_EXTENSIONS } from "../lib/constants";

interface ImportDialogProps {
  title: string;
  imageFormatsLabel: string;
  allFormatsLabel: string;
  selectedFormatsLabel: string;
  includeSubfoldersLabel: string;
  importLabel: string;
  cancelLabel: string;
  onConfirm: (extensions: string[], recursive: boolean) => void;
  onCancel: () => void;
}

export function ImportDialog({
  title,
  imageFormatsLabel,
  allFormatsLabel,
  selectedFormatsLabel,
  includeSubfoldersLabel,
  importLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: ImportDialogProps) {
  const [mode, setMode] = useState<"all" | "selected">("all");
  const [checked, setChecked] = useState<Set<string>>(new Set(IMAGE_EXTENSIONS));
  const [recursive, setRecursive] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onCancel]);

  function toggleExtension(ext: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(ext)) {
        next.delete(ext);
      } else {
        next.add(ext);
      }
      return next;
    });
  }

  function handleConfirm() {
    const exts = mode === "all" ? [...IMAGE_EXTENSIONS] : [...checked];
    onConfirm(exts, recursive);
  }

  const canImport = mode === "all" || checked.size > 0;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center bg-black/50 pt-[120px] backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        ref={ref}
        className="w-[460px] overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--glass-history)] shadow-[var(--shadow-dialog)] backdrop-blur-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pb-2 pt-6">
          <h2 className="text-base font-bold text-copy-strong">{title}</h2>
        </div>

        <div className="space-y-5 px-6 py-4">
          <div>
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-copy-muted">
              {imageFormatsLabel}
            </p>
            <label className="flex cursor-pointer items-center gap-3 py-1.5">
              <input
                type="radio"
                name="format-mode"
                checked={mode === "all"}
                onChange={() => setMode("all")}
                className="accent-[#1DB954]"
              />
              <span className="text-sm text-copy-strong">{allFormatsLabel}</span>
            </label>
            <label className="flex cursor-pointer items-center gap-3 py-1.5">
              <input
                type="radio"
                name="format-mode"
                checked={mode === "selected"}
                onChange={() => setMode("selected")}
                className="accent-[#1DB954]"
              />
              <span className="text-sm text-copy-strong">{selectedFormatsLabel}</span>
            </label>
            {mode === "selected" && (
              <div className="ml-7 mt-2 grid grid-cols-4 gap-x-2 gap-y-1">
                {IMAGE_EXTENSIONS.map((ext) => (
                  <label
                    key={ext}
                    className="flex cursor-pointer items-center gap-2 py-1"
                  >
                    <input
                      type="checkbox"
                      checked={checked.has(ext)}
                      onChange={() => toggleExtension(ext)}
                      className="accent-[#1DB954]"
                    />
                    <span className="text-xs text-copy">{ext}</span>
                  </label>
                ))}
              </div>
            )}
            {mode === "all" && (
              <p className="ml-7 mt-1.5 text-xs text-copy-muted">
                {IMAGE_EXTENSIONS.join(", ")}
              </p>
            )}
          </div>

          <div>
            <label className="flex cursor-pointer items-center gap-3 py-1.5">
              <input
                type="checkbox"
                checked={recursive}
                onChange={(e) => setRecursive(e.target.checked)}
                className="accent-[#1DB954]"
              />
              <span className="text-sm text-copy-strong">{includeSubfoldersLabel}</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 pb-6 pt-4">
          <button type="button" onClick={onCancel} className="button-secondary">
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canImport}
            className="bg-brand px-5 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-black transition hover:scale-[1.04] hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100 disabled:hover:bg-brand"
          >
            {importLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
