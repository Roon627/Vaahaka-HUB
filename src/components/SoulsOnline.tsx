"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useSea } from "./SeaProvider";

/** A quiet live presence indicator: understated and peaceful. */
export default function SoulsOnline() {
  const { online } = useSea();
  if (online < 1) return null;
  const text = online === 1 ? "1 person on the shore" : `${online} people on the shore`;

  return (
    <span
      className="inline-flex items-center gap-2 text-xs text-mist/80"
      aria-live="polite"
      title="People visiting Ihusaas right now"
    >
      <span className="relative flex h-1.5 w-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-sand/80" />
      </span>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={online}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {text}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
