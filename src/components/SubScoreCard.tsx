import { MiniBar } from "./MiniBar";
import { G } from "../utils/theme";
import type { SubScore } from "../types";

export function SubScoreCard({ label, score, color, status }: SubScore) {
  return (
    <div className="px-4 py-3.5 flex items-center gap-4" style={{ borderColor: G.border }}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <div className="min-w-0">
            <span className="text-[12px] font-medium" style={{ color: G.whiteDim }}>
              {label}
            </span>
            <span
              className="ml-2 px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase"
              style={{ color, background: `${color}16`, border: `1px solid ${color}30` }}
            >
              {status}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
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
