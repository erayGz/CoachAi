import { G } from "../utils/theme";

export function Chip({
  label,
  color = G.green,
  bg,
}: {
  label: string;
  color?: string;
  bg?: string;
}) {
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase"
      style={{ color, background: bg ?? `${color}18`, border: `1px solid ${color}30` }}
    >
      {label}
    </span>
  );
}
