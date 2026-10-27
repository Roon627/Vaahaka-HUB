"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";

/**
 * Shared bottom sheet: slides up on phones, centred card on desktop. Esc / backdrop tap closes.
 * Rendered in a portal on <body>: opened from inside the blurred nav pill, a `position: fixed` child would be
 * positioned relative to that pill (backdrop-filter creates a containing block) and end up half hidden.
 */
export default function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(
    <motion.div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-abyss/70 backdrop-blur-sm sm:items-center sm:p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
    >
      <motion.div
        role="dialog" aria-modal="true" aria-label={title}
        className="max-h-[92dvh] w-full max-w-md overflow-y-auto overscroll-contain rounded-t-3xl border border-white/10 bg-gradient-to-b from-tide to-deep p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-soft sm:rounded-3xl"
        initial={{ y: 70 }} animate={{ y: 0 }} exit={{ y: 70 }} transition={{ type: "spring", damping: 28, stiffness: 260 }}
        onClick={(e) => e.stopPropagation()}
      >
        <span aria-hidden className="mx-auto mb-3 block h-1.5 w-12 rounded-full bg-white/20 sm:hidden" />
        {children}
      </motion.div>
    </motion.div>,
    document.body
  );
}
