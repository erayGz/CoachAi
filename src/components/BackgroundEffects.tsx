import { G } from "../utils/theme";

export function FieldGrid({ opacity = 0.035 }: { opacity?: number }) {
  return (
    <svg
      style={{ opacity, pointerEvents: "none" }}
      className="absolute inset-0 w-full h-full"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="fg" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke={G.green} strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#fg)" />
    </svg>
  );
}

export function GlowOrb({
  top,
  right,
  size = 240,
  opacity = 0.08,
}: {
  top?: string;
  right?: string;
  size?: number;
  opacity?: number;
}) {
  return (
    <div
      className="absolute pointer-events-none rounded-full"
      style={{
        top,
        right,
        width: size,
        height: size,
        background: `radial-gradient(circle, ${G.green} 0%, transparent 70%)`,
        opacity,
        transform: "translate(40%, -40%)",
      }}
    />
  );
}
