/** 统计指标小标签 - 显示数量+标签，支持活跃高亮 */
export function MetricChip({
  label,
  value,
  active = false,
}: {
  label: string;
  value: number;
  active?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 px-3 py-1 text-[11px] ${
        active ? "bg-brand/14 text-copy-strong" : "bg-surface text-copy"
      }`}
    >
      <span className={`font-mono tabular-nums ${active ? "text-copy-strong" : "text-copy-muted"}`}>{value}</span>
      <span className="uppercase tracking-[0.18em]">{label}</span>
    </div>
  );
}
