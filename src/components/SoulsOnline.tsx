"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useSea } from "./SeaProvider";

const FACES = ["happy", "secrets", "nostalgia"];

/** "3 souls on the shore right now": a few little bottle faces bobbing beside the live count. Nothing shows until the live channel is connected. */
export default function SoulsOnline() {
  const { online } = useSea();
  if (online < 1) return null;
  const faces = FACES.slice(0, Math.min(3, online));
  const text = online === 1 ? "Just you on the shore right now" : `${online} souls on the shore right now`;
  return (
    <p className="mt-4 inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.04] py-1.5 pl-2 pr-4 text-xs text-mist backdrop-blur-sm" aria-live="polite">
      <span className="flex -space-x-2" aria-hidden>
        {faces.map((f, i) => (
          <motion.img key={f} src={`/brand/stickers/${f}.png`} alt="" width={22} height={26} className="h-[26px] w-auto drop-shadow"
            animate={{ y: [0, -3, 0] }} transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.5, ease: "easeInOut" }} />
        ))}
      </span>
      <span className="relative flex h-1.5 w-1.5" aria-hidden><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-glow opacity-60" /><span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-glow" /></span>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span key={online} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }}>{text}</motion.span>
      </AnimatePresence>
    </p>
  );
}
