"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useSea } from "./SeaProvider";

/** A tiny live chip: one bobbing bottle face and "3 souls here". Hidden until the live channel is connected. */
export default function SoulsOnline() {
  const { online } = useSea();
  if (online < 1) return null;
  const text = online === 1 ? "just you here" : `${online} souls here`;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.05] py-0.5 pl-1.5 pr-2.5 text-[11px] text-mist" aria-live="polite" title="People on the shore right now">
      <motion.img src="/brand/stickers/happy.png" alt="" width={16} height={19} className="h-[19px] w-auto" animate={{ y: [0, -2, 0], rotate: [0, -6, 0] }} transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }} />
      <span className="relative flex h-1.5 w-1.5" aria-hidden><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-glow opacity-60" /><span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-glow" /></span>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span key={online} initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -3 }} transition={{ duration: 0.18 }}>{text}</motion.span>
      </AnimatePresence>
    </span>
  );
}
