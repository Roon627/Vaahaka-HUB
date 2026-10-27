"use client";
import { motion } from "framer-motion";

/**
 * Unlike layout.tsx, a template remounts per route, so each page fades in.
 * Opacity ONLY: `filter` / `transform` on this wrapper would turn it into the
 * containing block for every `position: fixed` descendant (dialogs, depth gauge,
 * floating links), pinning them to the page instead of the viewport.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, ease: "easeOut" }}>
      {children}
    </motion.div>
  );
}
