import { G } from "../utils/theme";

export function MiniBar({ value, color = G.green }: { value: number; color?: string }) {
  return (
    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: G.card3 }}>
      <div
        className="h-full rounded-full"
        style={{ width: `${value}%`, background: color, boxShadow: `0 0 6px ${color}80` }}
      />
    </div>
  );
}
