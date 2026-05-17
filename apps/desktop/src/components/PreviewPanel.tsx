import { PreviewImage } from "./PreviewImage";

/** 预览面板属性 */
interface PreviewPanelProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  previewSrc?: string;
  emptyLabel: string;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  accent?: boolean;
  dropActive?: boolean;
  onDropClick?: () => void;
  dropActivePrompt?: string;
  dropPrompt?: string;
  browsePrompt?: string;
}

/**
 * 预览面板组件
 * - accent 模式：带有拖放交互的替换图面板（品牌色高亮边框+上传按钮）
 * - 普通模式：仅展示图片或空状态提示
 */
export function PreviewPanel({
  eyebrow,
  title,
  subtitle,
  previewSrc,
  emptyLabel,
  actions,
  footer,
  accent = false,
  dropActive = false,
  onDropClick,
  dropActivePrompt = "Release to assign",
  dropPrompt = "Drop image here",
  browsePrompt = "or click to browse",
}: PreviewPanelProps) {
  return (
    <section className="panel flex min-h-[260px] flex-col">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="eyebrow">{eyebrow}</p>
          <h2 className="mt-1 truncate text-xl font-bold text-copy-strong">{title}</h2>
          <p className="mt-1 truncate text-xs text-copy">{subtitle}</p>
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
      </div>

      <div
        className={`mt-4 flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-lg border ${
          accent
            ? dropActive
              ? "border-brand bg-brand/10 shadow-[0_0_0_1px_rgba(29,185,84,0.45)]"
              : "border-[var(--border-subtle)] bg-[var(--preview-accent)]"
            : "border-[var(--border-subtle)] bg-[var(--preview-default)]"
        }`}
      >
        {previewSrc ? (
          <PreviewImage src={previewSrc} alt={title} />
        ) : accent ? (
          <button
            type="button"
            onClick={onDropClick}
            className={`flex flex-col items-center gap-3 rounded-lg border-2 border-dashed px-8 py-8 text-center transition ${
              dropActive
                ? "border-brand bg-brand/10 text-copy-strong"
                : "border-[var(--border-strong)] bg-black/10 text-copy hover:border-brand/50 hover:text-copy-strong"
            }`}
          >
            <svg viewBox="0 0 24 24" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth="1.4">
              <path d="M12 4v12m0 0l-4-4m4 4l4-4" />
              <path d="M4 17v1a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-1" />
            </svg>
            <div>
              <p className="text-sm font-semibold">{dropActive ? dropActivePrompt : dropPrompt}</p>
              <p className="mt-1 text-xs text-copy-muted">{browsePrompt}</p>
            </div>
          </button>
        ) : (
          <p className="px-6 text-center text-sm uppercase tracking-[0.22em] text-copy-muted">{emptyLabel}</p>
        )}
      </div>

      {footer ? <div className="mt-4">{footer}</div> : null}
    </section>
  );
}
