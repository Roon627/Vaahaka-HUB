"use client";
import { motion } from "framer-motion";
import { CATEGORIES, type CategoryId } from "@/lib/constants";
import Sheet from "./Sheet";

interface Props {
  value: CategoryId | null;
  onChange: (c: CategoryId | null) => void;
  onClose: () => void;
  /** Optional per-mood totals (the map shows them): keys are mood ids plus "all". */
  counts?: Record<string, number>;
}

/**
 * "How does it feel?": every mood is the mascot wearing that mood's face. Tap one and the sheet closes,
 * so it's one tap, no scrolling sideways and nothing to dismiss.
 */
export default function MoodSheet({ value, onChange, onClose, counts }: Props) {
  const tiles = [{ id: null as CategoryId | null, label: "Everything", sticker: "happy", color: "#9fe3d0", key: "all" }, ...CATEGORIES.map((c) => ({ id: c.id as CategoryId | null, label: c.label, sticker: c.id, color: c.color, key: c.id as string }))];
  return (
    <Sheet title="How does it feel?" onClose={onClose}>
      <h2 className="font-display text-2xl text-foam">How does it feel?</h2>
      <p className="font-hand text-xl text-sand/80">Pick a mood and the sea sorts itself.</p>
      <div className="mt-4 grid grid-cols-4 gap-2.5">
        {tiles.map((t) => {
          const on = value === t.id;
          return (
            <motion.button
              key={t.key} aria-pressed={on} onClick={() => { navigator.vibrate?.(8); onChange(t.id); onClose(); }}
              whileHover={{ y: -3 }} whileTap={{ scale: 0.92 }}
              className="relative flex min-h-[6.25rem] flex-col items-center justify-center gap-1 rounded-2xl border px-1 py-2 text-[11px]"
              style={on ? { borderColor: `${t.color}aa`, background: `${t.color}26`, color: "#f5efe4" } : { borderColor: "rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#9db9b8" }}
            >
              <motion.img
                src={`/brand/stickers/${t.sticker}.svg`} alt="" width={40} height={48} className="h-11 w-auto"
                animate={on ? { rotate: [0, -8, 8, 0], scale: [1, 1.12, 1] } : { rotate: 0, scale: 1 }} transition={{ duration: 0.6 }}
              />
              <span className="max-w-full truncate">{t.label}</span>
              {counts && <span className="text-[10px] tabular-nums opacity-70">{(counts[t.key] ?? 0).toLocaleString()}</span>}
            </motion.button>
          );
        })}
      </div>
    </Sheet>
  );
}
