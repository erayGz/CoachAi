import { G } from "../utils/theme";
import type { VideoRule } from "../types";

export function VideoRuleCard({ icon, title, detail }: VideoRule) {
  return (
    <div className="flex items-start gap-3.5 rounded-xl px-4 py-3.5" style={{ background: G.card, border: `1px solid ${G.border}` }}>
      <span className="text-[18px] flex-shrink-0 mt-0.5">{icon}</span>
      <div>
        <p className="text-[13px] font-bold leading-snug" style={{ color: G.white, fontFamily: "'DM Sans', sans-serif" }}>
          {title}
        </p>
        <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: G.muted }}>
          {detail}
        </p>
      </div>
    </div>
  );
}
