import { G } from "../utils/theme";

export function ScoreRing({ score, size = 136 }: { score: number; size?: number }) {
  const stroke = 9;
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const arc = (score / 100) * circ;
  const cx = size / 2;
  const cy = size / 2;

  return (
    <svg width={size} height={size}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={G.card3} strokeWidth={stroke} />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={G.green}
        strokeWidth={stroke}
        strokeDasharray={`${arc} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ filter: `drop-shadow(0 0 10px ${G.green}80)` }}
      />
      <text
        x={cx}
        y={cy - 9}
        textAnchor="middle"
        fill={G.white}
        fontSize="30"
        fontWeight="800"
        fontFamily="'Barlow Condensed', sans-serif"
      >
        {score}
      </text>
      <text
        x={cx}
        y={cy + 12}
        textAnchor="middle"
        fill={G.muted}
        fontSize="11"
        fontFamily="'DM Sans', sans-serif"
      >
        out of 100
      </text>
    </svg>
  );
}
