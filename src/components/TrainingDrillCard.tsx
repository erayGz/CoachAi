import { G } from "../utils/theme";
import type { TrainingDrill } from "../types";

export function TrainingDrillCard({ drill, index }: { drill: TrainingDrill; index: number }) {
  return (
    <div className="px-4 py-3.5 flex items-center gap-3.5" style={{ borderColor: G.border }}>
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-[12px] font-black"
        style={{
          background: G.greenDim,
          color: G.green,
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        {index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold" style={{ color: G.white }}>{drill.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] font-bold" style={{ color: G.green, fontFamily: "'JetBrains Mono', monospace" }}>
            {drill.reps}
          </span>
          <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: G.card3, color: G.muted }}>
            {drill.focus}
          </span>
        </div>
      </div>
    </div>
  );
}
