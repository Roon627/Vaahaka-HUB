"use client";
import { useId } from "react";
import { motion } from "framer-motion";

interface Props {
  /** Mood colour: tints the glow and the ribbon around the scroll. */
  color: string;
  height?: number;
  /** Pops the cork off when true. */
  uncorked?: boolean;
  glow?: boolean;
  className?: string;
}

const BODY = "M24 20 H36 V34 C36 44 52 50 52 68 V104 C52 113 46 118 38 118 H22 C14 118 8 113 8 104 V68 C8 50 24 44 24 34 Z";

/** A glass message-bottle with a rolled paper inside, lit from within by the mood colour. */
export default function Bottle({ color, height = 96, uncorked = false, glow = true, className }: Props) {
  const uid = useId().replace(/:/g, "");
  return (
    <svg
      viewBox="0 0 60 124" width={height / 2.07} height={height} className={className} aria-hidden
      style={{ overflow: "visible", filter: glow ? `drop-shadow(0 0 14px ${color}88)` : undefined }}
    >
      <defs>
        <clipPath id={`c${uid}`}><path d={BODY} /></clipPath>
        <linearGradient id={`g${uid}`} x1="0" x2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".28" />
          <stop offset=".5" stopColor="#fff" stopOpacity=".05" />
          <stop offset="1" stopColor="#fff" stopOpacity=".18" />
        </linearGradient>
        <radialGradient id={`r${uid}`} cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor={color} stopOpacity=".7" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* inner light */}
      <g clipPath={`url(#c${uid})`}>
        <circle cx="30" cy="88" r="34" fill={`url(#r${uid})`} />
        <rect x="0" y="82" width="60" height="40" fill={color} opacity=".16" />
      </g>

      {/* the rolled message */}
      <g transform="rotate(-9 30 86)">
        <rect x="21" y="58" width="18" height="48" rx="3" fill="#f3e5c5" />
        <rect x="24" y="66" width="12" height="1.6" rx=".8" fill="#7a6a55" opacity=".5" />
        <rect x="24" y="72" width="9" height="1.6" rx=".8" fill="#7a6a55" opacity=".5" />
        <rect x="24" y="78" width="11" height="1.6" rx=".8" fill="#7a6a55" opacity=".5" />
        <rect x="20" y="88" width="20" height="4" rx="1" fill={color} />
      </g>

      {/* glass */}
      <path d={BODY} fill={`url(#g${uid})`} stroke="#fff" strokeOpacity=".5" strokeWidth="1.4" />
      <path d="M15 72 V102" stroke="#fff" strokeOpacity=".55" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M26 26 V33" stroke="#fff" strokeOpacity=".5" strokeWidth="1.6" strokeLinecap="round" />

      {/* cork */}
      <motion.g
        style={{ transformBox: "fill-box", transformOrigin: "center" }}
        animate={uncorked ? { y: -46, x: 18, rotate: 55, opacity: 0 } : { y: 0, x: 0, rotate: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 140, damping: 11 }}
      >
        <rect x="23.5" y="6" width="13" height="16" rx="3" fill="#c79b62" stroke="#a87f48" strokeWidth="1" />
        <circle cx="28" cy="12" r="1" fill="#a87f48" /><circle cx="33" cy="16" r="1" fill="#a87f48" />
      </motion.g>
    </svg>
  );
}
