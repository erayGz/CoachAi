import { Clock, Home, Target, User } from "lucide-react";
import { G } from "../utils/theme";
import { isShootingLabScreen } from "../utils/navigation";
import type { Navigate, Screen } from "../types";

export function BottomNav({ active, onNav }: { active: Screen; onNav: Navigate }) {
  const items: { id: Screen; icon: typeof Home; label: string }[] = [
    { id: "dashboard", icon: Home, label: "Home" },
    { id: "shooting-guide", icon: Target, label: "Analyze" },
    { id: "history", icon: Clock, label: "History" },
    { id: "profile", icon: User, label: "Profile" },
  ];

  return (
    <div className="flex items-center justify-around py-3" style={{ background: G.card, borderTop: `1px solid ${G.border}` }}>
      {items.map(({ id, icon: Icon, label }) => {
        const on = active === id || (id === "shooting-guide" && isShootingLabScreen(active));
        return (
          <button key={id} onClick={() => onNav(id)} className="flex flex-col items-center gap-1 px-4 transition-all">
            <Icon size={20} style={{ color: on ? G.green : G.muted }} />
            <span
              className="text-[10px] font-semibold tracking-wide"
              style={{ color: on ? G.green : G.muted, fontFamily: "'DM Sans', sans-serif" }}
            >
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
