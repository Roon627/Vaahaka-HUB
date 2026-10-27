/** A blob of wax with a stamped emoji — the mood marker on parchment. */
export default function WaxSeal({ color, emoji, size = 44, className = "" }: { color: string; emoji: string; size?: number; className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center ${className}`}
      style={{
        width: size, height: size, fontSize: size * 0.46,
        borderRadius: "52% 48% 55% 45% / 48% 54% 46% 52%",
        background: `radial-gradient(circle at 34% 28%, ${color}ff 0%, ${color}e6 38%, ${color}b0 100%)`,
        boxShadow: `inset 0 -4px 8px rgba(0,0,0,.28), inset 0 3px 6px rgba(255,255,255,.35), 0 4px 10px rgba(60,30,10,.35)`,
        filter: "saturate(.9)",
      }}
    >
      <span className="flex items-center justify-center rounded-full" style={{ width: size * 0.66, height: size * 0.66, boxShadow: "inset 0 0 0 1.5px rgba(0,0,0,.18), inset 0 2px 3px rgba(0,0,0,.2)" }}>
        {emoji}
      </span>
    </span>
  );
}
