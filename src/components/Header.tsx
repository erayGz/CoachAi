import { ArrowLeft } from "lucide-react";
import { G } from "../utils/theme";

export function Header({
  title,
  sub,
  onBack,
}: {
  title: string;
  sub?: string;
  onBack: () => void;
}) {
  return (
    <div className="coachai-screen-header flex items-center gap-3 px-5 pt-14 pb-4">
      <button
        onClick={onBack}
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: G.card2, border: `1px solid ${G.border}` }}
      >
        <ArrowLeft size={17} color={G.whiteDim} />
      </button>
      <div>
        <h1
          className="text-xl font-black tracking-wide uppercase leading-tight"
          style={{ fontFamily: "'Barlow Condensed', sans-serif", color: G.white }}
        >
          {title}
        </h1>
        {sub && <p className="text-[11px] mt-0.5" style={{ color: G.muted }}>{sub}</p>}
      </div>
    </div>
  );
}
