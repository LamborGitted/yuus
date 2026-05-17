import { useEffect, useRef } from "react";

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  destructive = false,
}: ConfirmDialogProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center bg-black/50 pt-[120px] backdrop-blur-sm" onClick={onCancel}>
      <div
        ref={ref}
        className="w-[420px] overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--glass-history)] shadow-[var(--shadow-dialog)] backdrop-blur-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pb-2 pt-6">
          <h2 className="text-base font-bold text-copy-strong">{title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-copy">{message}</p>
        </div>
        <div className="flex justify-end gap-3 px-6 pb-6 pt-4">
          <button type="button" onClick={onCancel} className="button-secondary">
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-lg px-5 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-copy-strong transition hover:scale-[1.04] ${
              destructive
                ? "bg-red-500 hover:bg-red-400"
                : "bg-brand text-black hover:bg-brand-hover"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
