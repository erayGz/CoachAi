import { G } from "../utils/theme";

export function StatCard({
  label,
  value,
  sub,
  color,
  className = "",
}: {
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl p-3.5 text-center ${className}`}
      style={{ background: G.card, border: `1px solid ${G.border}` }}
    >
      <div
        className="text-2xl font-black leading-none"
        style={{ fontFamily: "'Barlow Condensed', sans-serif", color }}
      >
        {value}
        {sub && <span className="text-sm" style={{ color: G.muted }}>{sub}</span>}
      </div>
      <div className="text-[9px] tracking-widest uppercase mt-1.5" style={{ color: G.muted }}>
        {label}
      </div>
    </div>
  );
}
