import { litPath } from "@/lib/moon";

/** Tonight's real moon: the dark side stays faintly visible, the lit side is drawn from the actual phase. */
export default function Moon({ phase, size }: { phase: number; size: number }) {
  const r = 50;
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className="h-full w-full" aria-hidden>
      <defs>
        <radialGradient id="moonlit" cx=".38" cy=".34" r=".75"><stop offset="0" stopColor="#fffaf0" /><stop offset=".6" stopColor="#f8e9bd" /><stop offset="1" stopColor="#ead08f" /></radialGradient>
        <clipPath id="moonclip"><path d={litPath(phase, 50, 50, r)} /></clipPath>
      </defs>
      <circle cx="50" cy="50" r={r} fill="#22343f" opacity=".55" />
      <g clipPath="url(#moonclip)">
        <circle cx="50" cy="50" r={r} fill="url(#moonlit)" />
        <circle cx="66" cy="32" r="8" fill="#d9bd7c" opacity=".35" /><circle cx="36" cy="60" r="6" fill="#d9bd7c" opacity=".3" /><circle cx="62" cy="66" r="4" fill="#d9bd7c" opacity=".3" />
      </g>
    </svg>
  );
}
