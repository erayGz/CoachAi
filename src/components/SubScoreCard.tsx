import { MiniBar } from "./MiniBar";
import { G } from "../utils/theme";
import type { SubScore } from "../types";

export function SubScoreCard({ label, score, color, delta }: SubScore) {
  return (
    <div className="px-4 py-3.5 flex items-center gap-4" style={{ borderColor: G.border }}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[12px] font-medium" style={{ color: G.whiteDim }}>
            {label}
          </span>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-[10px] font-bold" style={{ color: delta.startsWith("+") ? G.green : G.muted }}>
              {delta}
            </span>
            <span className="text-[14px] font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", color }}>
              {score}
            </span>
          </div>
        </div>
        <MiniBar value={score} color={color} />
      </div>
    </div>
  );
}
